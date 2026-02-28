import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";

const TRAINING_COOLDOWN_MS = 60 * 60 * 1000; // 1 Hour

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const result = await db.runTransaction(async (transaction) => {
            const userRef = db.collection('applications').doc(userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) return { success: false, reason: 'no_application' };
            const userData = userDoc.data()!;

            const now = Date.now();
            const lastTrainingTime = userData.lastTrainingTime || 0;

            if (now - lastTrainingTime < TRAINING_COOLDOWN_MS) {
                const remainingMs = TRAINING_COOLDOWN_MS - (now - lastTrainingTime);
                return { success: false, reason: 'cooldown', remainingMs };
            }

            const currentTrainingLevel = userData.trainingLevel || 0;
            const newTrainingLevel = currentTrainingLevel + 1;

            transaction.update(userRef, {
                trainingLevel: newTrainingLevel,
                lastTrainingTime: now
            });

            return {
                success: true,
                newLevel: newTrainingLevel,
                lastTrainingTime: now
            };
        });

        if (!result.success) {
            return NextResponse.json({ error: result.reason, remainingMs: result.remainingMs }, { status: 400 });
        }

        return NextResponse.json(result);

    } catch (err) {
        console.error("Error in training:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
