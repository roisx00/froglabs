import { Client, GatewayIntentBits, Partials, EmbedBuilder, TextChannel } from 'discord.js';
import * as dotenv from 'dotenv';
import { db } from './src/lib/firebase.js'; // Might need to adjust firebase imports for node CLI
// The bot needs its own simple firebase initialization or we can reuse lib/firebase if it works in pure Node.

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Reuse the checkAndPromoteRole logic manually or import it (since it's a separate process now)
// To keep bot.ts entirely standalone, we'll embed the core XP logic here.
const ROLES = {
    TADPOLE: '1135140834581414088',
    FROG_RUNNER: '1153652478508802068',
    CROAK_KNIGHT: '1149718327388811314',
    ROYAL_RIBBIT: '1155236969534726269',
    FROGFATHER: '1135129228183093308'
};

const xpCooldowns = new Map<string, number>();
const XP_COOLDOWN_MS = 60 * 1000;
const XP_PER_MESSAGE = 0.5;

client.on('ready', () => {
    console.log(`Standalone Discord Bot Logged in as ${client.user?.tag}!`);
    console.log(`This bot script is designed to run 24/7 on a platform like Railway or Render.`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const userId = message.author.id;
    const now = Date.now();
    const lastMsgTime = xpCooldowns.get(userId) || 0;

    if (now - lastMsgTime < XP_COOLDOWN_MS) return;
    xpCooldowns.set(userId, now);

    try {
        const userRef = db.collection('applications').doc(userId);
        const doc = await userRef.get();

        if (doc.exists) {
            const currentData = doc.data();
            const newChatXP = (currentData?.chatXP || 0) + XP_PER_MESSAGE;

            await userRef.update({ chatXP: newChatXP });

            // Check for Discord Role promotions based on Chat XP
            const member = await message.guild?.members.fetch(userId).catch(() => null);
            if (member) {
                if (newChatXP >= 1000 && !member.roles.cache.has(ROLES.FROG_RUNNER)) {
                    await member.roles.add(ROLES.FROG_RUNNER);
                    await userRef.update({ currentLevelRole: ROLES.FROG_RUNNER });
                    const channel = message.guild?.channels.cache.get('1135140417931841576') as TextChannel;
                    if (channel) channel.send(`SYSTEM: ${message.author.username} has reached Stage 1 (1,000 Chat XP) and earned the FROG RUNNER role.`);
                } else if (newChatXP >= 3000 && !member.roles.cache.has(ROLES.ROYAL_RIBBIT)) {
                    await member.roles.add(ROLES.ROYAL_RIBBIT);
                    await userRef.update({ currentLevelRole: ROLES.ROYAL_RIBBIT });
                    const channel = message.guild?.channels.cache.get('1135140417931841576') as TextChannel;
                    if (channel) channel.send(`SYSTEM: ${message.author.username} has reached Stage 2 (3,000 Chat XP) and earned the ROYAL RIBBIT role.`);
                }
            }
            console.log(`[Bot] Gave 0.5 XP to ${message.author.username}. Total: ${newChatXP}`);
        }
    } catch (error) {
        console.error('Error in messageCreate XP handler:', error);
    }
});

client.login(process.env.TOKEN);
