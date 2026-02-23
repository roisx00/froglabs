import { db } from './firebase';

// Role IDs - kept here for reference by API routes
export const ROLES = {
    TADPOLE: '1135140834581414088',
    FROG_RUNNER: '1153652478508802068',
    CROAK_KNIGHT: '1149718327388811314',
    ROYAL_RIBBIT: '1155236969534726269',
    FROGFATHER: '1135129228183093308'
};

export const XP_THRESHOLDS = {
    FROG_RUNNER: 1000,
    ROYAL_RIBBIT: 3000,
    CROAK_KNIGHT: 3000
};

export const calculateXP = (data: any) => {
    if (!data) return 0;
    return (data.chatXP || 0) + (data.socialXP || 0);
};

/**
 * assignDiscordRole — intentionally a no-op on Vercel.
 * Real role assignment is handled by bot.ts running on Railway.
 * We keep this export so callers (submit/route.ts etc) don't break.
 */
export async function assignDiscordRole(_userId: string, _roleId: string): Promise<boolean> {
    // Bot handles this — do nothing from the web server
    return true;
}

/**
 * checkAndPromoteRole — Firebase-only version safe to run on Vercel.
 * Updates currentLevelRole in Firestore based on XP thresholds.
 * bot.ts watches for these changes and assigns the actual Discord role.
 */
export async function checkAndPromoteRole(userId: string) {
    const userRef = db.collection('applications').doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) return;

    const app = doc.data()!;
    const chatXP = app.chatXP || 0;
    const socialXP = app.socialXP || 0;
    const updates: Record<string, any> = {};

    // --- Discord Chat XP path ---
    if (chatXP >= XP_THRESHOLDS.ROYAL_RIBBIT && app.chatRoleLevel !== 'royal_ribbit') {
        updates.chatRoleLevel = 'royal_ribbit';
        updates.currentLevelRole = ROLES.ROYAL_RIBBIT;
        updates.pendingRoleId = ROLES.ROYAL_RIBBIT; // bot picks this up
    } else if (chatXP >= XP_THRESHOLDS.FROG_RUNNER && !app.chatRoleLevel && app.chatRoleLevel !== 'royal_ribbit') {
        updates.chatRoleLevel = 'frog_runner';
        updates.currentLevelRole = ROLES.FROG_RUNNER;
        updates.pendingRoleId = ROLES.FROG_RUNNER;
    }

    // --- X Tasks (socialXP) path ---
    if (socialXP >= XP_THRESHOLDS.CROAK_KNIGHT && !app.xRoleAwarded) {
        updates.xRoleAwarded = true;
        updates.pendingRoleId = ROLES.CROAK_KNIGHT; // bot picks this up
    }

    if (Object.keys(updates).length > 0) {
        await userRef.update(updates);
    }
}
