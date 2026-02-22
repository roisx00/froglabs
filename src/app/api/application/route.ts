import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const doc = await db.collection('applications').doc((session.user as any).id).get();
        return NextResponse.json(doc.exists ? doc.data() : null);
    } catch (err) {
        console.error("Error fetching application:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
