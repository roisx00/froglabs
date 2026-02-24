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
    RIBBIT_RUNNER: '1153652478508802068',
    CROAK_KNIGHT: '1149718327388811314',
    ROYAL_RIBBIT: '1155236969534726269',
    FROGFATHER: '1135129228183093308'
};

// 10 messages = 5 XP. 20-second cooldown per user between counted messages.
const MSGS_PER_XP_AWARD = 10;
const XP_PER_AWARD = 5;
const SPAM_GUARD_MS = 20_000;
const spamGuard = new Map<string, number>();

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
        await tryAssignRole(guild, userId, ROLES.RIBBIT_RUNNER, 'RIBBIT RUNNER');
        updates.chatRoleLevel = 'ribbit_runner';
        updates.currentLevelRole = ROLES.RIBBIT_RUNNER;
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

    // 3-second spam guard — ignores messages sent too rapidly
    const lastMsg = spamGuard.get(userId) || 0;
    if (now - lastMsg < SPAM_GUARD_MS) return;
    spamGuard.set(userId, now);

    try {
        const userRef = db.collection('applications').doc(userId);
        const snap = await userRef.get();
        if (!snap.exists) return; // Not in the whitelist system

        const data = snap.data()!;
        const newCount = (data.messageCount || 0) + 1;
        const updates: Record<string, any> = { messageCount: newCount };

        // Award 5 XP every 10 messages
        const prevAwards = Math.floor((newCount - 1) / MSGS_PER_XP_AWARD);
        const newAwards = Math.floor(newCount / MSGS_PER_XP_AWARD);
        let newChatXP = data.chatXP || 0;

        if (newAwards > prevAwards) {
            newChatXP += XP_PER_AWARD;
            updates.chatXP = newChatXP;
            console.log(`[Bot] 🎯 +${XP_PER_AWARD} XP → ${message.author.username} (msg #${newCount}, total XP: ${newChatXP})`);
            await checkPromotion(message.guild, userId, newChatXP, data.socialXP || 0, message.author.username);
        } else {
            console.log(`[Bot] 💬 msg #${newCount} from ${message.author.username} (${MSGS_PER_XP_AWARD - (newCount % MSGS_PER_XP_AWARD)} msgs until next XP)`);
        }

        await userRef.update(updates);
    } catch (err) {
        console.error('[Bot] messageCreate error:', err);
    }
});

// ─── Ready ────────────────────────────────────────────────────────────────────
client.once('clientReady', () => {
    console.log(`✅ [Bot] Logged in as ${client.user?.tag}`);
    console.log(`📡 Serving guild: ${GUILD_ID}`);
    console.log(`💬 XP rate: +${XP_PER_AWARD} XP per ${MSGS_PER_XP_AWARD} messages (${SPAM_GUARD_MS / 1000}s spam guard)`);
    // Poll for pending roles from web server every 30 seconds
    setInterval(pollPendingRoles, 30_000);
});

client.login(process.env.TOKEN);
