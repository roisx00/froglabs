import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";

export async function GET() {
    try {
        const statsRef = db.collection('stats').doc('arenaStats');
        const statsDoc = await statsRef.get();

        const battlesSnap = await db.collection('battles')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const recentBattles = battlesSnap.docs.map(d => d.data());

        const arenaData = statsDoc.exists ? statsDoc.data() : {
            activeParticipants: 0,
            totalBattles: 0
        };

        return NextResponse.json({ ...arenaData, recentBattles });
    } catch (err) {
        console.error("Error fetching arena data:", err);
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
        const username = (session.user as any).username;

        const result = await db.runTransaction(async (transaction) => {
            const userRef = db.collection('applications').doc(userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) return { success: false, reason: 'no_application' };
            const userData = userDoc.data()!;

            const statsRef = db.collection('stats').doc('arenaStats');
            const statsDoc = await transaction.get(statsRef);

            const currentStats = statsDoc.exists ? statsDoc.data()! : {
                activeParticipants: 0,
                totalBattles: 0
            };

            // Find an opponent in the queue
            const queueSnap = await db.collection('applications')
                .where('inArenaQueue', '==', true)
                .limit(1)
                .get();

            if (queueSnap.empty) {
                // No opponent, join queue
                transaction.update(userRef, { inArenaQueue: true, arenaJoinedAt: Date.now() });
                return { success: true, status: 'queued' };
            }

            // Opponent found!
            const opponentDoc = queueSnap.docs[0];
            const opponentData = opponentDoc.data();
            const opponentId = opponentDoc.id;

            // Battle Logic (Turn-Based Simulation)
            // Goal: Generate ~70-100 lines of detailed logs for a realistic 3-4 minute frontend render

            // 1. Stats Setup (Scaling health high compared to damage to force multi-round fights)
            const p1 = {
                id: userId,
                name: username,
                hp: 1500 + (userData.resilience || 10) * 100 + (userData.trainingLevel || 0) * 50,
                maxHp: 1500 + (userData.resilience || 10) * 100 + (userData.trainingLevel || 0) * 50,
                speed: (userData.processingPower || 10) * 2,
                evasion: (userData.stealth || 10) * 1.5,
                dmgBase: 50 + (userData.trainingLevel || 0) * 20,
                xp: userData.socialXP || 0
            };

            const p2 = {
                id: opponentId,
                name: opponentData.username || "UNKNOWN_AGENT",
                hp: 1500 + (opponentData.resilience || 10) * 100 + (opponentData.trainingLevel || 0) * 50,
                maxHp: 1500 + (opponentData.resilience || 10) * 100 + (opponentData.trainingLevel || 0) * 50,
                speed: (opponentData.processingPower || 10) * 2,
                evasion: (opponentData.stealth || 10) * 1.5,
                dmgBase: 50 + (opponentData.trainingLevel || 0) * 20,
                xp: opponentData.socialXP || 0
            };

            const battleLog: string[] = [
                `>>> NEURAL UPLINK ESTABLISHED <<<`,
                `MATCHMAKING PROTOCOL: BAYOU QUEUE ACTIVATED.`,
                `${p1.name} [Lv.${userData.trainingLevel || 0}] vs ${p2.name} [Lv.${opponentData.trainingLevel || 0}]`,
                `INITIALIZING ARENA PARAMETERS...`,
                `SIMULATION COMMENCING...`
            ];

            // Turn-Based Combat Loop
            function executeTurn(attacker: typeof p1, defender: typeof p2, log: string[]) {
                // Evasion Check
                const hitChance = 90 - (defender.evasion * 0.5); // Base 90% hit chance, reduced by stealth
                const roll = Math.random() * 100;

                if (roll > hitChance) {
                    const dodgeFlavor = [
                        `${defender.name} evaded the synaptic strike.`,
                        `${attacker.name}'s attack missed completely.`,
                        `${defender.name}'s stealth protocols deflected the incoming payload.`,
                        `${attacker.name} miscalculated the target's trajectory.`,
                        `Partial shield deflection by ${defender.name}. Zero damage.`
                    ];
                    log.push(dodgeFlavor[Math.floor(Math.random() * dodgeFlavor.length)]);
                    return;
                }

                // Critical Hit Check
                const critChance = 5 + (attacker.xp / 1000); // 5% base crit + small bonus from total XP (Luck factor)
                const isCrit = (Math.random() * 100) <= critChance;

                // Damage Calculation
                const fluctuation = 0.85 + (Math.random() * 0.3); // 85% to 115% variability
                let damage = Math.floor(attacker.dmgBase * fluctuation);

                if (isCrit) {
                    damage = Math.floor(damage * 1.6); // 1.6x damage on crit
                    log.push(`CRITICAL OVERLOAD! ${attacker.name} channels maximum power!`);
                }

                defender.hp -= damage;
                defender.hp = Math.max(0, defender.hp); // Don't drop below 0

                // Hit Flavor
                const hitFlavor = [
                    `${attacker.name} hits ${defender.name} for ${damage} Neural Damage.`,
                    `${defender.name}'s firewall breached! Took ${damage} damage.`,
                    `${attacker.name} executed a flawless routine. ${damage} damage dealt.`,
                    `Direct hit by ${attacker.name}. ${defender.name} suffers ${damage} damage.`,
                    `System integrity compromised. ${defender.name} loses ${damage} HP.`
                ];
                log.push(hitFlavor[Math.floor(Math.random() * hitFlavor.length)]);

                // Occasional HP Status
                if (Math.random() > 0.75 && defender.hp > 0) {
                    const hpPercent = Math.floor((defender.hp / defender.maxHp) * 100);
                    log.push(`> ${defender.name} system status: ${hpPercent}% integrity.`);
                }
            }

            let round = 1;
            const MAX_ROUNDS = 150; // Hard cap fallback, but math should resolve before this

            while (p1.hp > 0 && p2.hp > 0 && round < MAX_ROUNDS) {
                battleLog.push(`--- ROUND ${round} ---`);

                // Initiative Roll
                const p1Initiative = p1.speed + Math.random() * 50;
                const p2Initiative = p2.speed + Math.random() * 50;

                const first = p1Initiative >= p2Initiative ? p1 : p2;
                const second = first.id === p1.id ? p2 : p1;

                // Combat
                executeTurn(first, second, battleLog);
                if (second.hp <= 0) break; // End if first attacker wins

                executeTurn(second, first, battleLog);
                round++;
            }

            const winner = p1.hp > 0 ? p1 : p2;
            const loser = p1.hp > 0 ? p2 : p1;

            battleLog.push(`--- SIMULATION CONCLUDED ---`);
            battleLog.push(`Target ${loser.name} resilience fully compromised. Core shutdown.`);
            battleLog.push(`VICTORY GRANTED TO ${winner.name}.`);

            const newBattle = {
                id: `battle_${Date.now()}`,
                winnerId: winner.id,
                winnerName: winner.name,
                loserId: loser.id,
                loserName: loser.name,
                timestamp: Date.now(),
                log: battleLog
            };

            // Update winner
            transaction.update(db.collection('applications').doc(winner.id), {
                battleCount: (winner.id === userId ? (userData.battleCount || 0) : (opponentData.battleCount || 0)) + 1,
                socialXP: (winner.id === userId ? (userData.socialXP || 0) : (opponentData.socialXP || 0)) + 100,
                inArenaQueue: false
            });

            // If loser isn't the current user (edge case prevention), update them too
            if (loser.id !== userId) {
                transaction.update(db.collection('applications').doc(loser.id), {
                    battleCount: (opponentData.battleCount || 0) + 1,
                    socialXP: (opponentData.socialXP || 0) + 10,
                    inArenaQueue: false
                });
            } else {
                transaction.update(userRef, {
                    battleCount: (userData.battleCount || 0) + 1,
                    socialXP: (userData.socialXP || 0) + 10,
                    inArenaQueue: false
                });
            }

            // Update arena stats
            const newTotalBattles = currentStats.totalBattles + 1;
            transaction.set(statsRef, {
                activeParticipants: currentStats.activeParticipants, // Keep active
                totalBattles: newTotalBattles
            }, { merge: true });

            // Add battle to recent battles collection
            const battleRef = db.collection('battles').doc(newBattle.id);
            transaction.set(battleRef, newBattle);

            return { success: true, status: 'battled', battle: newBattle };
        });

        if (!result.success) {
            return NextResponse.json({ error: result.reason }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (err) {
        console.error("Error in arena processing:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
