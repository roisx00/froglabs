import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { ROLES } from '@/lib/xp';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as any).id;
        const data = await req.json();
        const { wallet, quotedTweet, commentedTweet, username, xUsername } = data;

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
            xUsername: xUsername || '',
            quotedTweet: quotedTweet || '',
            commentedTweet: commentedTweet || '',
            status: 'pending',
            chatXP: 0,
            socialXP: 50,
            completedMissions: regMissions,
            submittedAt: new Date().toISOString(),
            currentLevelRole: ROLES.TADPOLE,
            // Bot will pick this up within 30 seconds and assign the Tadpole role
            pendingRoleId: ROLES.TADPOLE
        };

        await userRef.set(initialEntry);

        return NextResponse.json({ success: true, app: initialEntry });
    } catch (error) {
        console.error('Submit error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
