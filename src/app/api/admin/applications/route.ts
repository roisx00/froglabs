import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const snapshot = await db.collection('applications').orderBy('submittedAt', 'desc').get();
        const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(apps);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
