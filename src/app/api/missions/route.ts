import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";

export async function GET() {
    try {
        const snapshot = await db.collection('tasks').get();
        const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Sort in memory - tasks without order field go to the end
        missions.sort((a: any, b: any) => {
            const orderA = a.order ?? 999;
            const orderB = b.order ?? 999;
            return orderA - orderB;
        });

        return NextResponse.json(missions);
    } catch (err) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
