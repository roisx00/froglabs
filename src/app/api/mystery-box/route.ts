import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { ROLES, checkAndPromoteRole } from "../../../lib/xp";

const MAX_MYSTERY_BOXES = 500;

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ eligible: false, reason: 'unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Check global stats
        const statsRef = db.collection('stats').doc('mysteryBoxStats');
        const statsDoc = await statsRef.get();
        const totalOpened = statsDoc.exists ? (statsDoc.data()?.totalOpened || 0) : 0;

        if (totalOpened >= MAX_MYSTERY_BOXES) {
            return NextResponse.json({ eligible: false, reason: 'limit_reached', globalCount: totalOpened });
        }

        // Check user
        const userRef = db.collection('applications').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ eligible: false, reason: 'no_application' });
        }

        const userData = userDoc.data()!;
        if (userData.hasOpenedMysteryBox) {
            return NextResponse.json({ eligible: false, reason: 'already_opened' });
        }

        return NextResponse.json({ eligible: true, globalCount: totalOpened });

    } catch (err) {
        console.error("Error checking mystery box:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const result = await db.runTransaction(async (transaction) => {
            const statsRef = db.collection('stats').doc('mysteryBoxStats');
            const userRef = db.collection('applications').doc(userId);

            const [statsDoc, userDoc] = await Promise.all([
                transaction.get(statsRef),
                transaction.get(userRef)
            ]);

            // Initialize pool if not exists (500 boxes total)
            const defaultPool = {
                totalOpened: 0,
                'xp_10': 50,
                'xp_50': 50,
                'xp_69': 50,
                'xp_100': 100,
                'xp_200': 100,
                'role_royal': 50,
                'role_knight': 50,
                'role_father': 50
            };

            const pool = statsDoc.exists ? { ...defaultPool, ...statsDoc.data() } : defaultPool;

            if (pool.totalOpened >= MAX_MYSTERY_BOXES) {
                return { success: false, reason: 'limit_reached' };
            }

            if (!userDoc.exists) {
                return { success: false, reason: 'no_application' };
            }

            const userData = userDoc.data()!;
            if (userData.hasOpenedMysteryBox) {
                return { success: false, reason: 'already_opened' };
            }

            // --- Select Reward from Available Pool ---
            const availableRewards: string[] = [];
            Object.entries(pool).forEach(([key, count]) => {
                if (key !== 'totalOpened' && (count as number) > 0) {
                    availableRewards.push(key);
                }
            });

            if (availableRewards.length === 0) {
                return { success: false, reason: 'pool_exhausted' };
            }

            // Randomly select from available keys
            const selectedKey = availableRewards[Math.floor(Math.random() * availableRewards.length)];

            let rewardType = 'xp';
            let xpAmount = 0;
            let roleAwarded = null;
            let roleName = null;

            if (selectedKey.startsWith('xp_')) {
                rewardType = 'xp';
                xpAmount = parseInt(selectedKey.split('_')[1]);
            }
            if (selectedKey === 'role_royal') {
                rewardType = 'role';
                roleAwarded = ROLES.ROYAL_RIBBIT;
                roleName = 'Royal Ribbit';
            } else if (selectedKey === 'role_knight') {
                rewardType = 'role';
                roleAwarded = ROLES.CROAK_KNIGHT;
                roleName = 'Croak Knight';
            } else if (selectedKey === 'role_father') {
                rewardType = 'role';
                roleAwarded = ROLES.RIBBITFATHER;
                roleName = 'Ribbitfather';
            }

            const updates: any = {
                hasOpenedMysteryBox: true,
                mysteryBoxRewardType: rewardType,
                mysteryBoxOpenedAt: Date.now()
            };

            if (rewardType === 'xp') {
                updates.socialXP = (userData.socialXP || 0) + xpAmount;
                updates.mysteryBoxRewardValue = xpAmount;
            } else if (rewardType === 'role') {
                updates.currentLevelRole = roleAwarded;
                updates.pendingRoleId = roleAwarded; // Bot picks this up
                updates.mysteryBoxRewardValue = roleName;
            }

            // Update stats
            const statsUpdate: any = {
                totalOpened: pool.totalOpened + 1,
                [selectedKey]: (pool[selectedKey as keyof typeof defaultPool] as number) - 1
            };

            if (!statsDoc.exists) {
                transaction.set(statsRef, statsUpdate);
            } else {
                transaction.update(statsRef, statsUpdate);
            }

            transaction.update(userRef, updates);

            return {
                success: true,
                rewardType,
                xpAmount,
                roleName
            };
        });

        // After successful transaction, run XP check if needed (in case XP tipped them over a threshold)
        if (result.success && result.rewardType === 'xp') {
            await checkAndPromoteRole(userId).catch(e => console.error("Error in checkAndPromoteRole:", e));
        }

        return NextResponse.json(result);

    } catch (err) {
        console.error("Error opening mystery box:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
