import * as dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import { client, initDiscord } from './src/lib/discord';
import { ROLES, ROLE_ID_TO_NAME, checkAndPromoteRole, assignDiscordRole } from './src/lib/xp';
import { db } from './src/lib/firebase';

const dev = process.env.NODE_ENV !== 'production';
console.log(`> Initializing Next.js app (dev: ${dev})...`);
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || '3000', 10);

console.log('> Calling app.prepare()...');
app.prepare().then(() => {
    console.log('✅ Next.js app.prepare() completed successfully.');
    console.log('✅ Next.js app prepared');
    const expressApp = express();
    const server = createServer(expressApp);
    const io = new Server(server);

    // Auth & Middleware
    expressApp.use(bodyParser.urlencoded({ extended: true }));
    expressApp.use(bodyParser.json());
    expressApp.use(session({
        secret: process.env.SESSION_SECRET || 'fallback_secret',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 24 * 60 * 60 * 1000 }
    }));
    expressApp.use(passport.initialize());
    expressApp.use(passport.session());

    passport.serializeUser((user: any, done) => done(null, user));
    passport.deserializeUser((user: any, done) => done(null, user));

    passport.use(new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        callbackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/auth/discord/callback`,
        scope: ['identify', 'guilds']
    }, (accessToken, refreshToken, profile, done) => done(null, profile)));

    // Socket.io injection into request
    expressApp.use((req: any, res, next) => {
        req.io = io;
        next();
    });

    // Session API for Next.js
    expressApp.get('/api/user', (req: any, res) => {
        res.json(req.user || null);
    });

    expressApp.get('/api/missions', async (req, res) => {
        const snapshot = await db.collection('tasks').get();
        const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(missions);
    });

    expressApp.get('/api/application', async (req: any, res) => {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const doc = await db.collection('applications').doc(req.user.id).get();
        res.json(doc.exists ? doc.data() : null);
    });

    // Auth Routes
    expressApp.get('/auth/discord', passport.authenticate('discord'));
    expressApp.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/'));
    expressApp.get('/logout', (req, res) => {
        req.logout(() => {
            req.session.destroy(() => {
                res.redirect('/');
            });
        });
    });

    // Discord Bot Events
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        if (!message.guild) return;

        const userId = message.author.id;
        const userRef = db.collection('applications').doc(userId);
        const doc = await userRef.get();

        if (doc.exists) {
            const data = doc.data()!;
            const newChatXP = (data.chatXP || 0) + 5;
            await userRef.update({ chatXP: newChatXP });
            console.log(`✨ [XP] ${message.author.username} +5 XP | New Chat XP: ${newChatXP}`);

            // Check for promotion and emit socket update
            await checkAndPromoteRole(userId, io);
        }
    });

    // Next.js Handler
    expressApp.all('*', (req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    initDiscord(process.env.DISCORD_TOKEN!);

    server.listen(port, '0.0.0.0', () => {
        console.log(`> Ready on http://localhost:${port} and http://0.0.0.0:${port}`);
    });

});
