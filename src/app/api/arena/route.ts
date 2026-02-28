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

            // Battle Logic (Active Training > CP > XP Luck)
            const p1 = {
                id: userId,
                name: username,
                processing: userData.processingPower || 10,
                resilience: userData.resilience || 10,
                stealth: userData.stealth || 10,
                trainingLevel: userData.trainingLevel || 0,
                xp: userData.socialXP || 0
            };
            const p2 = {
                id: opponentId,
                name: opponentData.username || "UNKNOWN_AGENT",
                processing: opponentData.processingPower || 10,
                resilience: opponentData.resilience || 10,
                stealth: opponentData.stealth || 10,
                trainingLevel: opponentData.trainingLevel || 0,
                xp: opponentData.socialXP || 0
            };

            // Calculate Base Combat Power (CP)
            const p1CP = (p1.processing * 1.2) + (p1.stealth * 1.0) + (p1.resilience * 0.8);
            const p2CP = (p2.processing * 1.2) + (p2.stealth * 1.0) + (p2.resilience * 0.8);

            // Luck Modifier (Surge) based on total XP
            // Provides a random boost: baseline 0-5, plus up to 1 point per 500 XP
            const p1Surge = (Math.random() * 5) + (Math.random() * (p1.xp / 500));
            const p2Surge = (Math.random() * 5) + (Math.random() * (p2.xp / 500));

            // Final Score Calculation: Training is paramount (x100 multiplier)
            const p1Score = (p1.trainingLevel * 100) + p1CP + p1Surge;
            const p2Score = (p2.trainingLevel * 100) + p2CP + p2Surge;

            const winner = p1Score >= p2Score ? p1 : p2;
            const loser = p1Score >= p2Score ? p2 : p1;

            const battleLog = [
                `${winner.name} engaged ${loser.name} in the Neural Arena.`,
                `Training Levels: ${winner.name} [Lv.${winner.trainingLevel}] vs ${loser.name} [Lv.${loser.trainingLevel}]`,
                `${winner.name}'s Neural Core peaked with a Combat Score of ${Math.floor(Math.max(p1Score, p2Score))}.`,
                `Target ${loser.name} resilience compromised. Victory granted to ${winner.name}.`
            ];

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
