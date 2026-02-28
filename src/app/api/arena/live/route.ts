import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable aggressive caching for live endpoint

export async function GET() {
    try {
        const now = Date.now();
        // 30 Seconds threshold for "Online"
        const ONLINE_THRESHOLD = now - (30 * 1000);

        // 1. Fetch Online Agents
        const onlineSnapshot = await db.collection('applications')
            .where('lastArenaPing', '>=', ONLINE_THRESHOLD)
            .get();

        const onlineAgents = onlineSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.username || 'UNKNOWN',
                level: data.trainingLevel || 0
            };
        });

        // 2. Fetch Global Battle Feed (Last 20)
        const battlesSnapshot = await db.collection('settings').doc('arena').collection('battles')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        const globalBattles = battlesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                winnerName: data.winnerName,
                loserName: data.loserName,
                timestamp: data.timestamp,
                log: data.log
            };
        });

        return NextResponse.json({
            success: true,
            onlineAgents,
            globalBattles
        });

    } catch (err) {
        console.error("Error fetching live arena data:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
