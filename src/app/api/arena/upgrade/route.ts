import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";

export const POWERS_CATALOG: Record<string, { name: string; cost: number; boost: { stat: string; amount: number } }> = {
    // Tier 1 (500 XP)
    'p_overclock': { name: 'Synaptic Overclock', cost: 500, boost: { stat: 'processingPower', amount: 2 } },
    'p_ghost': { name: 'Ghost Protocol', cost: 500, boost: { stat: 'stealth', amount: 2 } },
    'p_kinetic': { name: 'Kinetic Barrier', cost: 500, boost: { stat: 'resilience', amount: 2 } },
    // Tier 2 (1500 XP)
    'p_quantum': { name: 'Quantum Processor', cost: 1500, boost: { stat: 'processingPower', amount: 5 } },
    'p_void': { name: 'Void Cloak', cost: 1500, boost: { stat: 'stealth', amount: 5 } },
    'p_aegis': { name: 'Aegis Shield', cost: 1500, boost: { stat: 'resilience', amount: 5 } },
    // Tier 3 (4000 XP)
    'p_core': { name: 'AI Core Upgrade', cost: 4000, boost: { stat: 'processingPower', amount: 10 } },
    'p_phantom': { name: 'Phantom Drive', cost: 4000, boost: { stat: 'stealth', amount: 10 } },
    'p_nano': { name: 'Nano-Armor', cost: 4000, boost: { stat: 'resilience', amount: 10 } },
    // Ultimate (10000 XP)
    'p_ascendancy': { name: 'Neural Ascendancy', cost: 10000, boost: { stat: 'ALL', amount: 5 } }
};

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { powerId } = await req.json();
        const power = POWERS_CATALOG[powerId];

        if (!power) {
            return NextResponse.json({ error: 'Invalid Power ID' }, { status: 400 });
        }

        const userId = (session.user as any).id;

        const result = await db.runTransaction(async (transaction) => {
            const userRef = db.collection('applications').doc(userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) return { success: false, reason: 'no_application' };
            const userData = userDoc.data()!;

            const currentXP = userData.socialXP || 0;

            if (currentXP < power.cost) {
                return { success: false, reason: 'insufficient_xp' };
            }

            // Deduct XP and determine new stats
            const updates: any = {
                socialXP: currentXP - power.cost
            };

            if (power.boost.stat === 'ALL') {
                updates.processingPower = (userData.processingPower || 0) + power.boost.amount;
                updates.stealth = (userData.stealth || 0) + power.boost.amount;
                updates.resilience = (userData.resilience || 0) + power.boost.amount;
            } else {
                updates[power.boost.stat] = (userData[power.boost.stat] || 0) + power.boost.amount;
            }

            transaction.update(userRef, updates);

            return { success: true, newStats: updates };
        });

        if (!result.success) {
            return NextResponse.json({ error: result.reason }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (err) {
        console.error("Error processing upgrade:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
