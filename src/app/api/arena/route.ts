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

            // Simulate battle logic
            const opponentId = "opponent_456"; // Placeholder for a real opponent selection
            const opponentName = "TARGET_SYSTEM_X"; // Placeholder

            const winnerId = userId;
            const winnerName = username;
            const loserId = opponentId;
            const loserName = opponentName;

            const battleLog = [
                `${username} engaged TARGET_SYSTEM_X in the Neural Arena.`,
                `${username}'s Neural Core frequency peaked at 88Hz.`,
                `TARGET_SYSTEM_X resilience compromised.`,
                `Victory granted to ${username}.`
            ];

            const newBattle = {
                id: `battle_${Date.now()}`,
                winnerId,
                winnerName,
                loserId,
                loserName,
                timestamp: Date.now(),
                log: battleLog
            };

            // Update user's battle count
            const newBattleCount = (userData.battleCount || 0) + 1;
            transaction.update(userRef, { battleCount: newBattleCount });

            // Update arena stats
            const newTotalBattles = currentStats.totalBattles + 1;
            transaction.set(statsRef, {
                activeParticipants: currentStats.activeParticipants + (currentStats.totalBattles === 0 ? 1 : 0), // Simple logic for active participants
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
