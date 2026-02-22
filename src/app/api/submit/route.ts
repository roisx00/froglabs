import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { checkAndPromoteRole, ROLES, assignDiscordRole } from '@/lib/xp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { userId, wallet, quotedTweet, commentedTweet, username } = data;

        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userRef = db.collection('applications').doc(userId);
        const doc = await userRef.get();

        if (doc.exists) {
            return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
        }

        const snapshot = await db.collection('tasks').where('location', '==', 'registration').get();
        const regMissions = snapshot.docs.map(d => d.id);

        const initialEntry = {
            username,
            id: userId,
            wallet,
            xUsername: 'extracted_from_client', // We'll handle extraction or just store raw
            quotedTweet,
            commentedTweet,
            status: 'pending',
            chatXP: 0,
            socialXP: 50,
            completedMissions: regMissions,
            submittedAt: new Date().toISOString(),
            currentLevelRole: ROLES.TADPOLE
        };

        await userRef.set(initialEntry);

        // Initial role assignment (Async)
        assignDiscordRole(userId, ROLES.TADPOLE);

        return NextResponse.json({ success: true, app: initialEntry });
    } catch (error) {
        console.error('Submit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
