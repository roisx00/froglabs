import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { checkAndPromoteRole, ROLES, assignDiscordRole } from '@/lib/xp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const userRef = db.collection('applications').doc(id);
        const doc = await userRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await userRef.update({
            status: 'approved',
            socialXP: (doc.data()?.socialXP || 0) + 200
        });

        // Assign Frogfather role for manual approval tracking
        await assignDiscordRole(id, ROLES.FROGFATHER);

        // Check for other promotions
        await checkAndPromoteRole(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
