import { Client, GatewayIntentBits, Partials, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

// ─── Firebase Init ───────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// ─── Discord Client ──────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ─── Config ───────────────────────────────────────────────────────────────────
const GUILD_ID = process.env.DISCORD_GUILD_ID!;
const ANNOUNCE_CHANNEL_ID = process.env.ANNOUNCE_CHANNEL_ID || '';

const ROLES = {
    TADPOLE: '1135140834581414088',
    FROG_RUNNER: '1153652478508802068',
    CROAK_KNIGHT: '1149718327388811314',
    ROYAL_RIBBIT: '1155236969534726269',
    FROGFATHER: '1135129228183093308'
};

// 1 msg = 0.5 XP. 1-minute cooldown to prevent spam farming.
const XP_PER_MESSAGE = 0.5;
const XP_COOLDOWN_MS = 60 * 1000;
const xpCooldowns = new Map<string, number>();

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function announce(guild: any, msg: string) {
    if (!ANNOUNCE_CHANNEL_ID) return;
    const ch = guild.channels.cache.get(ANNOUNCE_CHANNEL_ID) as TextChannel | undefined;
    ch?.send(msg).catch(() => { });
}

async function tryAssignRole(guild: any, userId: string, roleId: string, label: string) {
    try {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return;
        if (!member.roles.cache.has(roleId)) {
            await member.roles.add(roleId);
            console.log(`[Bot] ✅ Assigned ${label} to ${member.user.username}`);
            announce(guild, `🎉 **${member.user.username}** just earned the **${label}** role!`);
        }
    } catch (err) {
        console.error(`[Bot] ❌ Failed to assign ${label} to ${userId}:`, err);
    }
}

async function checkPromotion(guild: any, userId: string, chatXP: number, socialXP: number, username: string) {
    const userRef = db.collection('applications').doc(userId);
    const snap = await userRef.get();
    if (!snap.exists) return;
    const app = snap.data()!;

    const updates: Record<string, any> = {};

    // Chat XP path
    if (chatXP >= 3000 && app.chatRoleLevel !== 'royal_ribbit') {
        await tryAssignRole(guild, userId, ROLES.ROYAL_RIBBIT, 'ROYAL RIBBIT');
        updates.chatRoleLevel = 'royal_ribbit';
        updates.currentLevelRole = ROLES.ROYAL_RIBBIT;
    } else if (chatXP >= 1000 && !app.chatRoleLevel && app.chatRoleLevel !== 'royal_ribbit') {
        await tryAssignRole(guild, userId, ROLES.FROG_RUNNER, 'FROG RUNNER');
        updates.chatRoleLevel = 'frog_runner';
        updates.currentLevelRole = ROLES.FROG_RUNNER;
    }

    // Social XP path (web sets socialXP, bot promotes)
    if (socialXP >= 3000 && !app.xRoleAwarded) {
        await tryAssignRole(guild, userId, ROLES.CROAK_KNIGHT, 'CROAK KNIGHT');
        updates.xRoleAwarded = true;
    }

    // Clear any pendingRoleId set by the web server
    if (app.pendingRoleId) {
        await tryAssignRole(guild, userId, app.pendingRoleId, app.pendingRoleId);
        updates.pendingRoleId = admin.firestore.FieldValue.delete();
    }

    if (Object.keys(updates).length > 0) {
        await userRef.update(updates);
    }
}

// ─── Watch for pendingRoleId changes from web server ─────────────────────────
// Every 30 seconds, scan for any users that have a pendingRoleId set by Vercel
async function pollPendingRoles() {
    try {
        const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
        if (!guild) return;

        const snap = await db.collection('applications').where('pendingRoleId', '!=', null).get();
        for (const doc of snap.docs) {
            const data = doc.data();
            if (!data.pendingRoleId) continue;
            await tryAssignRole(guild, doc.id, data.pendingRoleId, data.pendingRoleId);
            await doc.ref.update({ pendingRoleId: admin.firestore.FieldValue.delete() });
        }
    } catch (err) {
        console.error('[Bot] Poll error:', err);
    }
}

// ─── Message XP Handler ───────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild || message.guild.id !== GUILD_ID) return;

    const userId = message.author.id;
    const now = Date.now();
    const lastMsg = xpCooldowns.get(userId) || 0;
    if (now - lastMsg < XP_COOLDOWN_MS) return;
    xpCooldowns.set(userId, now);

    try {
        const userRef = db.collection('applications').doc(userId);
        const snap = await userRef.get();
        if (!snap.exists) return; // Not registered in the whitelist system

        const data = snap.data()!;
        const newChatXP = (data.chatXP || 0) + XP_PER_MESSAGE;

        await userRef.update({ chatXP: newChatXP });
        console.log(`[Bot] +${XP_PER_MESSAGE} XP → ${message.author.username} (total: ${newChatXP.toFixed(1)})`);

        await checkPromotion(message.guild, userId, newChatXP, data.socialXP || 0, message.author.username);
    } catch (err) {
        console.error('[Bot] messageCreate error:', err);
    }
});

// ─── Ready ────────────────────────────────────────────────────────────────────
client.once('clientReady', () => {
    console.log(`✅ [Bot] Logged in as ${client.user?.tag}`);
    console.log(`📡 Serving guild: ${GUILD_ID}`);
    console.log(`💬 XP rate: ${XP_PER_MESSAGE} XP/msg (1-min cooldown)`);
    // Poll for pending roles from web server every 30 seconds
    setInterval(pollPendingRoles, 30_000);
});

client.login(process.env.TOKEN);
