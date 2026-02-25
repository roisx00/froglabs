import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { title, link, xpReward, type, location, actionType } = data;

        // Get current max order for this location without requiring an index
        const snapshot = await db.collection('tasks').where('location', '==', location).get();
        let maxOrder = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.order && data.order > maxOrder) {
                maxOrder = data.order;
            }
        });

        const id = 't' + Date.now();
        await db.collection('tasks').doc(id).set({
            id, title, link, xpReward: parseInt(xpReward), type, location, actionType,
            order: maxOrder + 1
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('POST task error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { updates } = await req.json(); // Array of { id, order }
        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: 'Invalid updates' }, { status: 400 });
        }

        const batch = db.batch();
        updates.forEach((u: any) => {
            const ref = db.collection('tasks').doc(u.id);
            batch.update(ref, { order: u.order });
        });
        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PUT task error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
        await db.collection('tasks').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
