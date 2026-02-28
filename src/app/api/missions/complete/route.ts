import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { checkAndPromoteRole } from '@/lib/xp';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userId = (session.user as any).id;
        const { missionId, xpReward } = await req.json();

        if (!missionId) return NextResponse.json({ error: 'Missing missionId' }, { status: 400 });

        const userRef = db.collection('applications').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const data = doc.data()!;
        const completedMissions = data.completedMissions || [];

        if (completedMissions.includes(missionId)) {
            return NextResponse.json({ error: 'Mission already completed' }, { status: 400 });
        }

        // Reward XP and add to completed list
        await userRef.update({
            socialXP: (data.socialXP || 0) + (xpReward || 50),
            completedMissions: [...completedMissions, missionId],
            missionCount: (data.missionCount || 0) + 1
        });

        // Check for role promotions
        await checkAndPromoteRole(userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mission complete error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
