import { db } from './firebase';
import { client } from './discord';
import { Server } from 'socket.io';

export const ROLES = {
    TADPOLE: '1135140834581414088',
    FROG_RUNNER: '1153652478508802068',
    CROAK_KNIGHT: '1149718327388811314',
    ROYAL_RIBBIT: '1155236969534726269',
    FROGFATHER: '1135129228183093308'
};

export const ROLE_ID_TO_NAME: Record<string, string> = Object.fromEntries(
    Object.entries(ROLES).map(([name, id]) => [id, name.replace(/_/g, ' ')])
);

export const XP_THRESHOLDS = {
    FROG_RUNNER: 1000,
    ROYAL_RIBBIT: 3000,
    CROAK_KNIGHT: 3000
};

export const calculateXP = (data: any) => {
    if (!data) return 0;
    return (data.chatXP || 0) + (data.socialXP || 0);
};

export async function assignDiscordRole(userId: string, roleId: string, io?: Server) {
    const GUILD_ID = process.env.DISCORD_GUILD_ID!;
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(userId);
        await member.roles.add(roleId);
        console.log(`✅ [Discord Automation] Role ${roleId} assigned successfully to ${userId}`);
        if (io) {
            io.emit('roleUpdate', { userId, roleId, roleName: ROLE_ID_TO_NAME[roleId] });
        }
        return true;
    } catch (error) {
        console.error(`❌ [Discord Automation] Failed to assign role ${roleId} to ${userId}:`, error);
        return false;
    }
}

export async function checkAndPromoteRole(userId: string, io?: Server) {
    const userRef = db.collection('applications').doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) return;
    const app = doc.data()!;

    const chatXP = app.chatXP || 0;
    const socialXP = app.socialXP || 0;
    let updated = false;

    // --- Discord Chat XP path ---
    if (chatXP >= 1000 && (!app.chatRoleLevel || app.chatRoleLevel === 'tadpole')) {
        const success = await assignDiscordRole(userId, ROLES.FROG_RUNNER, io);
        if (success) {
            app.chatRoleLevel = 'frog_runner';
            updated = true;
            console.log(`🚀 [Promotion] ${app.username} -> FROG RUNNER (Discord Grinding 1000 XP)`);
        }
    }

    if (chatXP >= 3000 && app.chatRoleLevel === 'frog_runner') {
        const success = await assignDiscordRole(userId, ROLES.ROYAL_RIBBIT, io);
        if (success) {
            app.chatRoleLevel = 'royal_ribbit';
            updated = true;
            console.log(`🚀 [Promotion] ${app.username} -> ROYAL RIBBIT (Discord Grinding 3000 XP)`);
        }
    }

    // --- X Tasks (socialXP) path ---
    if (socialXP >= 3000 && !app.xRoleAwarded) {
        const success = await assignDiscordRole(userId, ROLES.CROAK_KNIGHT, io);
        if (success) {
            app.xRoleAwarded = true;
            updated = true;
            console.log(`🚀 [Promotion] ${app.username} -> CROAK KNIGHT (X Tasks 3000 XP)`);
        }
    }

    if (updated) {
        app.currentLevelRole = app.chatRoleLevel === 'royal_ribbit' ? ROLES.ROYAL_RIBBIT
            : app.chatRoleLevel === 'frog_runner' ? ROLES.FROG_RUNNER
                : ROLES.TADPOLE;

        await userRef.update(app);
    }

    if (io) {
        io.emit('xpUpdate', {
            userId,
            chatXP: app.chatXP,
            socialXP: app.socialXP,
            totalXP: calculateXP(app),
            chatRoleLevel: app.chatRoleLevel,
            xRoleAwarded: app.xRoleAwarded,
            status: app.status
        });
    }
}
