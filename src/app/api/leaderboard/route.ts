import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";

export async function GET() {
    try {
        const snapshot = await db.collection('applications').get();

        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            const totalXP = (data.chatXP || 0) + (data.socialXP || 0);

            // Map roles to readable tiers
            let tier = 'Tadpole';
            const roleId = data.currentLevelRole;
            if (roleId === '1135129228183093308') tier = 'Ribbitfather';
            else if (roleId === '1155236969534726269') tier = 'Royal Ribbit';
            else if (roleId === '1149718327388811314') tier = 'Croak Knight';
            else if (roleId === '1153652478508802068') tier = 'Ribbit Runner';

            return {
                id: doc.id,
                username: data.username || 'Anonymous',
                xp: totalXP,
                tier: tier
            };
        });

        // Sort by totalXP descending
        users.sort((a, b) => b.xp - a.xp);

        // Take top 10
        const topUsers = users.slice(0, 10).map((user, index) => ({
            ...user,
            rank: index + 1
        }));

        return NextResponse.json(topUsers);
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
