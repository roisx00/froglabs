import { Client, GatewayIntentBits, Partials } from 'discord.js';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

export const initDiscord = (token: string) => {
    client.login(token).catch((err) => {
        console.error('❌ [Discord] Failed to login:', err);
    });

    client.once('ready', () => {
        console.log(`✅ [Discord] Logged in as ${client.user?.tag}`);
    });
};
