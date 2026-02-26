import { Client, GatewayIntentBits, Partials, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

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
const RULES_CHANNEL_ID = '1135228182065328148';
const RESOURCES_CHANNEL_ID = '1153205831970586664';
const HOW_TO_WHITELIST_CHANNEL_ID = '1153313313443291156';

// Portability: Use relative path for header images
const RULES_HEADER_IMG = './rules_header.png';
const LINKS_HEADER_IMG = './links_header.png';
const WL_HEADER_IMG = './wl_header.png';

const HOW_TO_WHITELIST_GUIDE = [
    '# 🐸 OPERATION: WHITELIST PROCUREMENT',
    'Welcome to the secure perimeter. To earn your status in the **Ribbit Royale**, you must complete the following directives. Operational excellence is mandatory.',
    '',
    '### 📡 01 | DATABASE ENTRY',
    'Initiate your credentials at our secure procurement portal:',
    '> **👉 [WHITELIST PORTAL](https://www.whitelist.ribbitroyale.fun/)**',
    '',
    '### 🔋 02 | XP ACCUMULATION',
    'Accumulate enough XP to bypass security filters. Clearance is granted through active participation:',
    '• **Chat Intel**: Engage with units in the server to generate Chat XP.',
    '• **Social Missions**: Execute tasks on the portal to generate Social XP.',
    '',
    '### 🎖️ 03 | RANK ASCENSION',
    'Higher clearance levels significantly increase your probability of final approval:',
    '• **Ribbit Runner**: Standard recognition (1,000 Chat XP).',
    '• **Royal Ribbit**: High-level clearance (3,000 Chat XP).',
    '• **Croak Knight**: Elite contributor status (3,000 Social XP).',
    '',
    '### 🛡️ 04 | COMMAND REVIEW',
    'Upon submission of your application and XP verification, the **MANAGERS** will conduct a final review. Your status will be updated via the secure portal and reflected in your roles.',
    '',
    '> **"STAY ACTIVE. STAY VIGILANT."**',
    '',
    '***'
].join('\n');

const TRUSTABLE_LINKS = [
    'Below links are only trustable links:',
    '',
    'Twitter: https://x.com/22RibbitRoyale',
    'Website: https://www.ribbitroyale.fun',
    'Whitelist portal: https://www.whitelist.ribbitroyale.fun/'
].join('\n');

const SERVER_RULES = [
    '# 🐸 RIBBIT ROYALE: COMMAND PROTOCOLS',
    'Welcome to the amphibious front. To maintain operational integrity, all units must adhere to the following protocols:',
    '',
    '### 01 | INTERNAL COMMUNICATIONS',
    'Maintain a baseline of mutual respect. Hostility, harassment, or corrosive behavior will result in immediate decommissioning.',
    '',
    '### 02 | CHANNEL INTEGRITY',
    'Execute operations in their designated sectors. Keep general intel in #general, and mission-specific data in appropriate tactical channels.',
    '',
    '### 03 | SECURITY CLEARANCE',
    'Self-promotion, unauthorized links, and phishing attempts are high-level security breaches. Perpetrators will be purged.',
    '',
    '### 04 | THE AMPHIBIOUS PARADIGM',
    'No hate speech, toxicity, or NSFW content. This is a high-performance environment. Keep it professional.',
    '',
    '### 05 | COMMAND AUTHORITY',
    'Follow the directives of the **RIBBITFATHER** and high-level officers. Decisions regarding server security are final.',
    '',
    '*Failure to comply with these protocols will result in a suspension of deployment or total server ejection.*',
    '',
    '**PROTOCOL INITIATED.**'
].join('\n');

const ROLES = {
    TADPOLE: '1135140834581414088',
    RIBBIT_RUNNER: '1153652478508802068',
    CROAK_KNIGHT: '1149718327388811314',
    ROYAL_RIBBIT: '1155236969534726269',
    RIBBITFATHER: '1135129228183093308', // GTD Role
    MANAGERS: '1135128626224971787'     // Admin/Team Role
};

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

    if (chatXP >= 3000 && app.chatRoleLevel !== 'royal_ribbit') {
        await tryAssignRole(guild, userId, ROLES.ROYAL_RIBBIT, 'ROYAL RIBBIT');
        updates.chatRoleLevel = 'royal_ribbit';
        updates.currentLevelRole = ROLES.ROYAL_RIBBIT;
    } else if (chatXP >= 1000 && !app.chatRoleLevel && app.chatRoleLevel !== 'royal_ribbit') {
        await tryAssignRole(guild, userId, ROLES.RIBBIT_RUNNER, 'RIBBIT RUNNER');
        updates.chatRoleLevel = 'ribbit_runner';
        updates.currentLevelRole = ROLES.RIBBIT_RUNNER;
    }

    if (socialXP >= 3000 && !app.xRoleAwarded) {
        await tryAssignRole(guild, userId, ROLES.CROAK_KNIGHT, 'CROAK KNIGHT');
        updates.xRoleAwarded = true;
    }

    if (app.pendingRoleId) {
        await tryAssignRole(guild, userId, app.pendingRoleId, app.pendingRoleId);
        updates.pendingRoleId = admin.firestore.FieldValue.delete();
    }

    if (Object.keys(updates).length > 0) {
        await userRef.update(updates);
    }
}

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

// ─── Combined Message Handler ────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content || '';
    const userId = message.author.id;
    const username = message.author.username;
    const channelName = (message.channel as any).name || 'Private/DM';

    // 🔔 CRITICAL DEBUG: Logs EVERY message the bot sees
    console.log(`[Bot] 📨 In #${channelName} from ${username}: "${content.substring(0, 50)}"`);

    // 1. Handle Commands
    if (content.startsWith('!')) {
        try {
            const args = content.slice(1).split(/ +/);
            const command = args.shift()?.toLowerCase();

            if (command === 'debug') {
                const member = await message.guild?.members.fetch(userId);
                const roles = member?.roles.cache.map(r => `${r.name} (${r.id})`).join(', ');
                await message.reply(`🛠️ **Debug Info**\n**Channel:** <#${message.channel.id}>\n**ID:** ${message.channel.id}\n**Roles:** ${roles}`);
                return;
            }

            if (command === 'rules') {
                if (!message.guild) return;

                const member = await message.guild.members.fetch(userId);
                const hasRole = member.roles.cache.has(ROLES.MANAGERS);

                console.log(`[Bot] 🛡️ Rules command by ${username}. Permission: ${hasRole ? 'ALLOWED' : 'DENIED'}`);

                if (!hasRole) {
                    return message.reply(`❌ [ACCESS_DENIED] Restricted. (Missing Role: MANAGERS)`).then(m => setTimeout(() => m.delete(), 5000));
                }

                const channel = message.guild.channels.cache.get(RULES_CHANNEL_ID) as TextChannel | undefined;
                if (channel) {
                    console.log(`[Bot] 📜 Sending rules to #${channel.name}...`);

                    const files = [];
                    if (fs.existsSync(RULES_HEADER_IMG)) {
                        files.push(RULES_HEADER_IMG);
                    } else {
                        console.log(`[Bot] ⚠️ Header image not found at ${path.resolve(RULES_HEADER_IMG)} - sending without image.`);
                    }

                    await channel.send({ content: SERVER_RULES, files });
                    await message.reply(`✅ Rules deployed to <#${RULES_CHANNEL_ID}>.`);
                } else {
                    console.log(`[Bot] ❌ Target channel not found: ${RULES_CHANNEL_ID}`);
                    await message.reply(`❌ Target channel not found. (ID: ${RULES_CHANNEL_ID})`);
                }
                return;
            }

            if (command === 'links' || command === 'link') {
                if (!message.guild) return;

                const member = await message.guild.members.fetch(userId);
                const hasRole = member.roles.cache.has(ROLES.MANAGERS);

                if (!hasRole) {
                    return message.reply(`❌ [ACCESS_DENIED] Restricted. (Missing Role: MANAGERS)`).then(m => setTimeout(() => m.delete(), 5000));
                }

                const channel = message.guild.channels.cache.get(RESOURCES_CHANNEL_ID) as TextChannel | undefined;
                if (channel) {
                    console.log(`[Bot] 📜 Sending links to #${channel.name}...`);
                    const files = [];
                    if (fs.existsSync(LINKS_HEADER_IMG)) {
                        files.push(LINKS_HEADER_IMG);
                    }
                    await channel.send({ content: TRUSTABLE_LINKS, files });
                    await message.reply(`✅ Links deployed to <#${RESOURCES_CHANNEL_ID}>.`);
                } else {
                    console.log(`[Bot] ❌ Target channel not found: ${RESOURCES_CHANNEL_ID}`);
                    await message.reply(`❌ Target channel not found. (ID: ${RESOURCES_CHANNEL_ID})`);
                }
                return;
            }

            if (command === 'whitelist') {
                if (!message.guild) return;

                const member = await message.guild.members.fetch(userId);
                const hasRole = member.roles.cache.has(ROLES.RIBBITFATHER);

                if (!hasRole) {
                    return message.reply(`❌ [ACCESS_DENIED] Restricted. (Missing Role: ${ROLES.RIBBITFATHER})`).then(m => setTimeout(() => m.delete(), 5000));
                }

                const channel = message.guild.channels.cache.get(HOW_TO_WHITELIST_CHANNEL_ID) as TextChannel | undefined;
                if (channel) {
                    console.log(`[Bot] 📜 Sending WL guide to #${channel.name}...`);
                    const files = [];
                    if (fs.existsSync(WL_HEADER_IMG)) {
                        files.push(WL_HEADER_IMG);
                    }
                    await channel.send({ content: HOW_TO_WHITELIST_GUIDE, files });
                    await message.reply(`✅ Whitelist guide deployed to <#${HOW_TO_WHITELIST_CHANNEL_ID}>.`);
                } else {
                    console.log(`[Bot] ❌ Target channel not found: ${HOW_TO_WHITELIST_CHANNEL_ID}`);
                    await message.reply(`❌ Target channel not found. (ID: ${HOW_TO_WHITELIST_CHANNEL_ID})`);
                }
                return;
            }
        } catch (err) {
            console.error('[Bot] ❌ Command Error:', err);
            message.reply('❌ [SYSTEM_ERROR] Check terminal logs.').catch(() => { });
        }
    }

    // 2. Handle XP tracking
    if (!message.guild || message.guild.id !== GUILD_ID) return;

    const now = Date.now();
    if (now - (spamGuard.get(userId) || 0) < SPAM_GUARD_MS) return;
    spamGuard.set(userId, now);

    try {
        const userRef = db.collection('applications').doc(userId);
        const snap = await userRef.get();
        if (!snap.exists) return;

        const data = snap.data()!;
        const newCount = (data.messageCount || 0) + 1;
        const updates: Record<string, any> = { messageCount: newCount };

        if (Math.floor(newCount / MSGS_PER_XP_AWARD) > Math.floor((newCount - 1) / MSGS_PER_XP_AWARD)) {
            const newChatXP = (data.chatXP || 0) + XP_PER_AWARD;
            updates.chatXP = newChatXP;
            console.log(`[Bot] 🎯 +${XP_PER_AWARD} XP → ${username} (Total: ${newChatXP})`);
            await checkPromotion(message.guild, userId, newChatXP, data.socialXP || 0, username);
        } else {
            console.log(`[Bot] 💬 ${username} msg #${newCount}`);
        }

        await userRef.update(updates);
    } catch (err) {
        console.error('[Bot] XP error:', err);
    }
});

client.once('clientReady', () => {
    console.log(`✅ [Bot] Online as ${client.user?.tag}`);
    console.log(`📡 Serving: ${GUILD_ID}`);
    setInterval(pollPendingRoles, 30_000);
});

client.login(process.env.TOKEN);
