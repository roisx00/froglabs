import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";

export async function GET() {
    try {
        const snapshot = await db.collection('tasks').orderBy('order', 'asc').get();
        const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(missions);
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
