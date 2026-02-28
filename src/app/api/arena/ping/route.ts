import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        await db.collection('applications').doc(userId).update({
            lastArenaPing: Date.now()
        });

        return NextResponse.json({ success: true, timestamp: Date.now() });

    } catch (err: any) {
        // If the document doesn't exist, we don't need to throw a fatal error
        if (err.code === 5) {
            return NextResponse.json({ success: false, reason: 'no_application' }, { status: 404 });
        }
        console.error("Error in heartbeat ping:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
