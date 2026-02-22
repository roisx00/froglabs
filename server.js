require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const bodyParser = require('body-parser');
const fs = require('fs');
const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Role Definitions & Milestones
const ROLES = {
  TADPOLE: '1135140834581414088',
  FROG_RUNNER: '1153652478508802068',
  CROAK_KNIGHT: '1149718327388811314',
  ROYAL_RIBBIT: '1155236969534726269',
  FROGFATHER: '1135129228183093308'
};

const ROLE_ID_TO_NAME = Object.fromEntries(
  Object.entries(ROLES).map(([name, id]) => [id, name.replace(/_/g, ' ')])
);

const XP_THRESHOLDS = {
  FROG_RUNNER: 1000,
  ROYAL_RIBBIT: 3000,
  CROAK_KNIGHT: 3000
};

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'internxbt123';

const DATA_FILE = 'applications.json';
const TASKS_FILE = 'tasks.json';

let applications = [];
let missions = [];

if (fs.existsSync(DATA_FILE)) {
  try {
    applications = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`Loaded ${applications.length} applications`);
  } catch (e) {
    console.log('Error loading applications.json');
  }
}

const saveApplications = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(applications, null, 2));
};

if (fs.existsSync(TASKS_FILE)) {
  try {
    missions = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch (e) {
    console.log('Error loading tasks.json');
  }
}
const saveMissions = () => fs.writeFileSync(TASKS_FILE, JSON.stringify(missions, null, 2));

// Auth & Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/discord/callback',
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

// Helper to extract X username from URL (robust against arrays)
const extractXUsername = (url) => {
  if (!url) return 'N/A';
  const target = Array.isArray(url) ? url.find(u => u && u.length > 0) : url;
  if (!target) return 'N/A';
  const match = target.match(/(?:x|twitter)\.com\/([a-zA-Z0-9_]+)/);
  return match ? `@${match[1]}` : 'N/A';
};

// Helper to assign Discord Role via Bot
async function assignDiscordRole(userId, roleId) {
  const GUILD_ID = process.env.DISCORD_GUILD_ID;

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);
    await member.roles.add(roleId);
    console.log(`✅ [Discord Automation] Role ${roleId} assigned successfully to ${userId}`);

    // Notify dashboard
    io.emit('roleUpdate', { userId, roleId, roleName: ROLE_ID_TO_NAME[roleId] });
    return true;
  } catch (error) {
    console.error(`❌ [Discord Automation] Failed to assign role ${roleId} to ${userId}:`, error);
    return false;
  }
}

// XP Promotion Engine - separate chat XP and social XP paths
async function checkAndPromoteRole(userId) {
  const app = applications.find(a => a.id === userId);
  if (!app) return;

  const chatXP = app.chatXP || 0;
  const socialXP = app.socialXP || 0;

  // --- Discord Chat XP path ---
  // Stage 1: TADPOLE -> FROG RUNNER at 1000 chat XP
  if (chatXP >= 1000 && (!app.chatRoleLevel || app.chatRoleLevel === 'tadpole')) {
    const success = await assignDiscordRole(userId, ROLES.FROG_RUNNER);
    if (success) {
      app.chatRoleLevel = 'frog_runner';
      console.log(`🚀 [Promotion] ${app.username} -> FROG RUNNER (Discord Grinding 1000 XP)`);
    }
  }

  // Stage 2: FROG RUNNER -> ROYAL RIBBIT at 3000 chat XP
  if (chatXP >= 3000 && app.chatRoleLevel === 'frog_runner') {
    const success = await assignDiscordRole(userId, ROLES.ROYAL_RIBBIT);
    if (success) {
      app.chatRoleLevel = 'royal_ribbit';
      console.log(`🚀 [Promotion] ${app.username} -> ROYAL RIBBIT (Discord Grinding 3000 XP)`);
    }
  }

  // --- X Tasks (socialXP) path ---
  // 0 -> 3000 -> CROAK KNIGHT
  if (socialXP >= 3000 && !app.xRoleAwarded) {
    const success = await assignDiscordRole(userId, ROLES.CROAK_KNIGHT);
    if (success) {
      app.xRoleAwarded = true;
      console.log(`🚀 [Promotion] ${app.username} -> CROAK KNIGHT (X Tasks 3000 XP)`);
    }
  }

  // Keep legacy currentLevelRole in sync for backwards compat
  app.currentLevelRole = app.chatRoleLevel === 'royal_ribbit' ? ROLES.ROYAL_RIBBIT
    : app.chatRoleLevel === 'frog_runner' ? ROLES.FROG_RUNNER
      : ROLES.TADPOLE;

  saveApplications();

  // Emit update to dashboard
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

// Helper to get User Roles from Discord via Bot
async function getMemberRoles(userId) {
  const GUILD_ID = process.env.DISCORD_GUILD_ID;

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);
    return Array.from(member.roles.cache.keys());
  } catch (error) {
    console.error(`❌ [Discord] Failed to fetch roles for ${userId}:`, error);
    return [];
  }
}

// XP Engine Logic
// XP Engine Logic - Source of Truth: appData
const calculateXP = (appData) => {
  if (!appData) return 0;
  return (appData.chatXP || 0) + (appData.socialXP || 0);
};

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) return next();
  res.redirect('/admin-login');
};

// Helper for HTML shell
const layout = (title, content, head = '', bodyClass = '', user = null) => `
  <!DOCTYPE HTML>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | 22 FROGS</title>
    <link rel="stylesheet" href="/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    ${head}
  </head>
  <body class="${bodyClass}">
    ${(user || bodyClass.includes('admin') || title.includes('Admin')) ? `
      <header>
        <div style="display: flex; align-items: center; gap: 15px;">
          <div class="logo-container">
            <img src="/img/logo.png" alt="22 FROGS" style="height: 42px; width: 42px; object-fit: cover; border-radius: 50%; border: 2px solid black; background: #eee;">
          </div>
          <span style="font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: #333;">${title.includes('Admin') ? 'Master Control' : 'User Panel'}</span>
        </div>
        <a href="/logout" class="btn-logout" style="font-size: 0.75rem; padding: 6px 12px;">Sign Out</a>
      </header>
    ` : ''}
    <div class="container ${title === 'Home' ? 'hero-container' : ''}" style="padding-top: ${user ? '100px' : '20px'};">
      ${content}
    </div>

    ${user ? `
      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        const currentUserId = "${user.id}";

        socket.on('xpUpdate', (data) => {
          if (data.userId !== currentUserId) return;
          
          // Update Identity Level (Status)
          const statusValue = document.querySelector('.stat-card .stat-value[style*="color"]');
          if (statusValue && data.status) {
            statusValue.textContent = data.status === 'approved' ? 'GTD MINT' : (data.status === 'pending' ? 'PENDING REVIEW' : data.status.toUpperCase());
            statusValue.style.color = data.status === 'approved' ? '#22c55e' : '#ffdd00';
          }

          // Update Total XP Label
          const totalXpLabel = document.querySelector('.stat-card div[style*="font-size: 0.75rem"]');
          if (totalXpLabel) totalXpLabel.textContent = "Total XP: " + data.totalXP;

          // Update X Tasks Progress
          const xLabel = document.querySelector('.xp-row:nth-child(1) .xp-count');
          const xBar = document.querySelector('.xp-row:nth-child(1) .xp-bar-fill');
          if (xLabel) {
            xLabel.textContent = data.socialXP >= 3000 ? '✅ CROAK KNIGHT UNLOCKED' : data.socialXP + ' / 3000 XP → Croak Knight';
          }
          if (xBar) {
            xBar.style.width = Math.min((data.socialXP / 3000) * 100, 100) + '%';
          }

          // Update Discord Grinding Progress
          const dLabel = document.querySelector('.xp-row:nth-child(2) .xp-count');
          const dBar = document.querySelector('.xp-row:nth-child(2) .xp-bar-fill');
          const dHint = document.querySelector('div[style*="font-size: 0.65rem"]');
          
          if (dLabel && dBar) {
            const chatXP = data.chatXP;
            if (chatXP < 1000) {
              dLabel.textContent = "Stage 1: " + chatXP + " / 1000 XP → Frog Runner";
              dBar.style.width = (chatXP / 1000) * 100 + "%";
              dBar.style.background = "#5865F2";
              if (dHint) dHint.textContent = "PROMOTION: RANK UP: REACH 1000 CHAT XP FOR FROG RUNNER";
            } else if (chatXP < 3000) {
              dLabel.textContent = "Stage 2: " + chatXP + " / 3000 XP → Royal Ribbit";
              dBar.style.width = ((chatXP - 1000) / 2000) * 100 + "%";
              dBar.style.background = "#7289da";
              if (dHint) dHint.textContent = "PROMOTION: RANK UP: REACH 3000 CHAT XP FOR ROYAL RIBBIT";
            } else {
              dLabel.textContent = "✅ ROYAL RIBBIT UNLOCKED";
              dBar.style.width = "100%";
              dBar.style.background = "#22c55e";
              if (dHint) dHint.textContent = "PROMOTION: ULTIMATE STATUS ACHIEVED";
            }
          }
        });

        socket.on('roleUpdate', (data) => {
          if (data.userId !== currentUserId) return;
          console.log('🎖️ Real-time Role Update:', data);
          
          // Refresh the badges (easiest way to sync multiple roles)
          // For now, let's just append if it's new or reload
          // Actually, a simple location.reload() might be too jarring, 
          // let's try to update the badge gallery if we find it
          const gallery = document.querySelector('.badge-gallery');
          if (gallery) {
            // Find if badge already exists
            const existingBadges = Array.from(gallery.querySelectorAll('.role-tag')).map(el => el.textContent.trim());
            if (!existingBadges.includes(data.roleName)) {
              const span = document.createElement('span');
              span.className = 'role-tag role-wl';
              span.style.fontSize = '0.7rem';
              span.textContent = data.roleName;
              gallery.appendChild(span);
            }
          }
        });
      </script>
    ` : ''}
  </body>
  </html>
`;

// Admin login page
app.get('/admin-login', (req, res) => {
  res.send(layout('Admin Login', `
    <div class="glass-card" style="max-width: 450px; margin: 100px auto;">
      <h1 class="gradient-text" style="margin-bottom: 30px; text-align: center;">Admin Access</h1>
      <form action="/admin-login" method="POST">
        <input type="password" name="password" placeholder="Enter admin password" required>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Login to Dashboard</button>
      </form>
    </div>
  `));
});

// Handle admin login
app.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.send(layout('Error', `
      <div class="glass-card" style="max-width: 450px; margin: 100px auto; text-align: center;">
        <span class="step-indicator">Security Alert</span>
        <h1 style="color: #ff5555; margin-bottom: 20px;">Access Denied</h1>
        <p style="margin-bottom: 30px; font-weight: 600; color: #666;">Invalid administrator credentials detected.</p>
        <a href="/admin-login" class="btn-primary" style="text-decoration: none; display: inline-block;">Try Again</a>
      </div>
    `));
  }
});

// Admin panel
app.get('/admin', isAdmin, (req, res) => {
  const tableRows = applications.length === 0
    ? '<tr><td colspan="8" style="text-align:center; padding: 60px; color: #b0b0cc; font-weight: 600;">No registrations in the system.</td></tr>'
    : applications.map((app, index) => `
    <tr>
      <td>
        <div style="font-weight: 700;">${app.username}</div>
        <div style="font-size: 0.75rem; color: #999;">ID: ${app.id}</div>
      </td>
      <td style="font-family: monospace; font-size: 0.8rem;">${app.wallet}</td>
      <td style="font-weight: 800; color: #00a2ff;">${app.xUsername || 'N/A'}</td>
      <td style="font-size: 0.8rem;"><a href="${app.quotedTweet}" target="_blank" class="role-tag role-default" style="text-decoration:none;">Quote</a></td>
      <td style="font-size: 0.8rem;"><a href="${app.commentedTweet}" target="_blank" class="role-tag role-default" style="text-decoration:none;">Comment</a></td>
      <td>
        <span class="badge badge-${app.status}" style="font-size: 0.7rem;">${app.status.toUpperCase()}</span>
      </td>
      <td style="font-size: 0.8rem; color: #666;">${new Date(app.submittedAt).toLocaleDateString()}</td>
      <td>
        ${app.status === 'pending' ? `
          <div style="display:flex; gap: 5px;">
            <a href="/admin/approve/${index}" class="role-tag role-wl" style="text-decoration:none; padding: 4px 8px;">Approve</a>
            <a href="/admin/reject/${index}" class="role-tag role-mod" style="text-decoration:none; padding: 4px 8px;">Reject</a>
          </div>
        ` : '<span style="color: #ccc;">—</span>'}
      </td>
    </tr>
  `).join('');

  res.send(layout('Admin Dashboard', `
    <div style="max-width: 1100px; margin: 0 auto;">
      <div class="admin-header">
        <h1 class="gradient-text">Master Control</h1>
        <div style="display:flex; gap: 10px; align-items:center;">
           <div class="role-tag role-wl" style="border:none;">BOT ACTIVE</div>
           <a href="/logout" class="btn-logout">EXIT</a>
        </div>
      </div>

      <div class="dashboard-grid" style="margin-bottom: 30px; grid-template-columns: repeat(3, 1fr);">
        <div class="stat-card">
          <div class="stat-label">Total Applicants</div>
          <div class="stat-value">${applications.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Approved</div>
          <div class="stat-value" style="color: #22c55e;">${applications.filter(a => a.status === 'approved').length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Missions</div>
          <div class="stat-value" style="color: #00a2ff;">${missions.length}</div>
        </div>
      </div>

      <!-- Mission Manager -->
      <div class="glass-card" style="margin-bottom: 30px; padding: 25px;">
        <h3 style="margin-top: 0; margin-bottom: 20px; text-transform: uppercase; font-size: 0.8rem; color: #666;">Mission Deployment</h3>
        <form action="/admin/missions/add" method="POST" style="display: grid; grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr; gap: 10px;">
          <input type="text" name="title" placeholder="Mission Name" required style="margin:0;">
          <input type="text" name="link" placeholder="Target URL" required style="margin:0;">
          <input type="number" name="xpReward" placeholder="XP" required style="margin:0;">
          <select name="type" style="margin:0; border: 2px solid black; border-radius: 8px; padding: 10px; font-weight: 700;">
            <option value="social">Social</option>
            <option value="discord">Discord</option>
          </select>
          <select name="location" style="margin:0; border: 2px solid black; border-radius: 8px; padding: 10px; font-weight: 700;">
            <option value="registration">Registration</option>
            <option value="dashboard">Dashboard</option>
          </select>
          <select name="actionType" style="margin:0; border: 2px solid black; border-radius: 8px; padding: 10px; font-weight: 700;">
            <option value="follow">Follow</option>
            <option value="like">Like</option>
            <option value="quote">Quote</option>
            <option value="comment">Comment</option>
            <option value="join">Join</option>
            <option value="none">None</option>
          </select>
          <button type="submit" class="btn-go" style="width:100%; height:100%; grid-column: span 6;">DEPLOY MISSION</button>
        </form>
        <div style="margin-top: 20px;">
          ${missions.map(m => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; font-size: 0.85rem;">
              <span><strong>[${(m.type || 'none').toUpperCase()}]</strong> ${m.title} (+${m.xpReward} XP) - <em>${m.location || 'registration'}</em> (${m.actionType || 'none'})</span>
              <a href="/admin/missions/delete/${m.id}" style="color: #ff5555; text-decoration: none; font-weight: 800;">DESTROY</a>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="glass-card" style="padding: 0px; max-width: 100%; border-radius: 12px; overflow: hidden; margin-top: 0;">
        <div class="table-container">
          <table style="border: none;">
            <thead style="background: #f8f8f8;">
              <tr>
                <th>Applicant</th>
                <th>Wallet</th>
                <th>X Handle</th>
                <th>Quote</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `, '', '', req.user));
});

// Approve / Reject
app.get('/admin/approve/:index', isAdmin, async (req, res) => {
  const index = parseInt(req.params.index);
  if (applications[index] && applications[index].status === 'pending') {
    applications[index].status = 'approved';
    const userId = applications[index].id;

    // Assign Frogfather role for manual approval tracking
    await assignDiscordRole(userId, ROLES.FROGFATHER);

    // Also give bonus XP for approval
    applications[index].socialXP = (applications[index].socialXP || 0) + 200;
    saveApplications();
    await checkAndPromoteRole(userId);
  }
  res.redirect('/admin');
});

app.get('/admin/reject/:index', isAdmin, (req, res) => {
  const index = parseInt(req.params.index);
  if (applications[index]) {
    applications[index].status = 'rejected';
    saveApplications();
  }
  res.redirect('/admin');
});

// Mission Management (Admin)
app.post('/admin/missions/add', isAdmin, (req, res) => {
  const { title, link, xpReward, type, location, actionType } = req.body;
  missions.push({
    id: 't' + Date.now(),
    title,
    link,
    xpReward: parseInt(xpReward),
    type: type || 'social',
    location: location || 'registration',
    actionType: actionType || 'none'
  });
  saveMissions();
  res.redirect('/admin');
});

app.get('/admin/missions/delete/:id', isAdmin, (req, res) => {
  missions = missions.filter(m => m.id !== req.params.id);
  saveMissions();
  res.redirect('/admin');
});


// Homepage / Dashboard
app.get('/', async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.send(layout('Home', `
      <div class="hero">
        <img src="/img/frogs-gray-ensemble.png" alt="22 Frogs" class="frogs-img">
        <div>
          <a href="/auth/discord" class="btn-discord">LOGIN WITH DISCORD</a>
        </div>
      </div>
    `, '', 'no-scroll'));
  }

  const userApp = applications.find(app => app.id === user.id);
  const status = userApp ? userApp.status : 'guest';

  // Real-time Data Sync
  const roles = await getMemberRoles(user.id);
  const totalXP = calculateXP(userApp);

  let dashboardContent = '';

  if (userApp) {
    const mintStatus = userApp.status === 'approved' ? 'GTD MINT' : 'PENDING REVIEW';
    const statusColor = userApp.status === 'approved' ? '#22c55e' : '#ffdd00';

    // --- X Tasks Progress: socialXP 0 → 3000 (toward CROAK KNIGHT) ---
    const socialXP = userApp.socialXP || 0;
    const xTasksProgress = Math.min((socialXP / 3000) * 100, 100);
    const xRoleLabel = socialXP >= 3000 ? '✅ CROAK KNIGHT UNLOCKED' : `${socialXP} / 3000 XP → Croak Knight`;

    // --- Discord Grinding XP: tiered 0→1000 (Frog Runner), then 1000→3000 (Royal Ribbit) ---
    const chatXP = userApp.chatXP || 0;
    let discordStageLabel, discordProgress, discordBarColor;
    if (chatXP < 1000) {
      discordStageLabel = `Stage 1: ${chatXP} / 1000 XP → Frog Runner`;
      discordProgress = (chatXP / 1000) * 100;
      discordBarColor = '#5865F2';
    } else if (chatXP < 3000) {
      discordStageLabel = `Stage 2: ${chatXP} / 3000 XP → Royal Ribbit`;
      discordProgress = ((chatXP - 1000) / 2000) * 100;
      discordBarColor = '#7289da';
    } else {
      discordStageLabel = '✅ ROYAL RIBBIT UNLOCKED';
      discordProgress = 100;
      discordBarColor = '#22c55e';
    }

    // Role Goal Hint
    let nextRoleHint = '';
    if (chatXP < 1000) nextRoleHint = 'Rank Up: Reach 1000 Chat XP for Frog Runner';
    else if (chatXP < 3000) nextRoleHint = 'Rank Up: Reach 3000 Chat XP for Royal Ribbit';
    else if (socialXP < 3000) nextRoleHint = 'Rank Up: Complete X Tasks for Croak Knight';
    else nextRoleHint = 'Rank Up: Ultimate Status Achieved';

    const dashboardMissions = missions.filter(m => m.location === 'dashboard');
    const completedDashboardMissions = userApp.completedMissions ? userApp.completedMissions.filter(id => dashboardMissions.some(m => m.id === id)) : [];

    const missionsHtml = dashboardMissions.length > 0 ? dashboardMissions.map(m => {
      const isCompleted = userApp.completedMissions && userApp.completedMissions.includes(m.id);
      return `
        <div class="mission-item" style="${isCompleted ? 'opacity: 0.5;' : ''}">
          <div class="mission-info">
            <h4>${m.title}</h4>
            <p>${m.type === 'social' ? 'X Intelligence Mission' : 'Community Enlistment'}</p>
          </div>
          <div style="display: flex; align-items: center;">
            <div class="mission-reward">${isCompleted ? 'CLAIMED' : '+' + m.xpReward + ' XP'}</div>
            ${isCompleted ?
          '<span class="badge badge-approved" style="border: none;">DONE</span>' :
          `<a href="${m.link}" target="_blank" class="btn-go">INITIATE</a>`}
          </div>
        </div>
      `;
    }).join('') : '<p style="text-align: center; color: #666; padding: 20px;">No active X missions for the dashboard yet.</p>';

    dashboardContent = `
      <div style="max-width: 800px; margin: 0 auto; padding-bottom: 50px;">
        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-label">Identity Level</div>
            <div class="stat-value" style="color: ${statusColor}">${mintStatus}</div>
            <div style="font-size: 0.75rem; color: #666; margin-top: 5px;">Total XP: ${totalXP}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Discord Status</div>
            <div class="stat-value" style="font-size: 1.1rem;">${user.username}</div>
            <div class="badge-gallery" style="margin-top: 10px;">
              ${roles.length > 0 ? roles.map(rId => `<span class="role-tag role-wl" style="font-size: 0.7rem;">${ROLE_ID_TO_NAME[rId] || 'CITIZEN'}</span>`).join('') : '<span class="role-tag role-default">TADPOLE</span>'}
            </div>
            <div style="font-size: 0.65rem; color: #999; margin-top: 8px; font-weight: 700;">PROMOTION: ${nextRoleHint.toUpperCase()}</div>
          </div>
        </div>


        <div class="xp-container" style="margin-top: 25px;">
          <!-- X Tasks Progress: 0 → 3000 → CROAK KNIGHT -->
          <div class="xp-row">
            <div class="xp-header">
              <div class="xp-label">⚡ X Tasks Grind</div>
              <div class="xp-count">${xRoleLabel}</div>
            </div>
            <div class="xp-bar-bg">
              <div class="xp-bar-fill social" style="width: ${xTasksProgress}%"></div>
            </div>
            <div style="font-size: 0.7rem; color: #888; margin-top: 5px;">Complete X tasks on Dashboard to earn the Croak Knight role</div>
          </div>

          <!-- Discord Grinding: tiered 0→1000 then 1000→3000 -->
          <div class="xp-row" style="margin-top: 20px;">
            <div class="xp-header">
              <div class="xp-label">💬 Discord Grinding</div>
              <div class="xp-count">${discordStageLabel}</div>
            </div>
            <div class="xp-bar-bg">
              <div class="xp-bar-fill discord" style="width: ${discordProgress}%; background: ${discordBarColor};"></div>
            </div>
            <div style="font-size: 0.7rem; color: #888; margin-top: 5px;">Chat in #general: 0→1000 XP = Frog Runner &nbsp;|&nbsp; 1000→3000 XP = Royal Ribbit</div>
          </div>
        </div>

        <div class="mission-card">
          <h3 style="margin-top: 0; margin-bottom: 20px; font-weight: 800; text-transform: uppercase; font-size: 0.9rem; color: #666;">Dashboard X Tasks</h3>
          ${missionsHtml}
        </div>
      </div>
    `;
  } else {
    const regMissions = missions.filter(m => m.location === 'registration');
    dashboardContent = `
      <div style="max-width: 600px; margin: 0 auto;">
        <div class="glass-card" style="margin-top: 0;">
          <h2 class="gradient-text" style="text-align: center; margin-bottom: 5px;">Mission Onboarding</h2>
          <p style="text-align: center; color: #666; font-size: 0.9rem; margin-bottom: 30px; font-weight: 600;">Complete all directives to unlock mint eligibility</p>

          <form action="/submit" method="POST">
            ${regMissions.map((m, idx) => `
              <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                <span class="step-indicator">Directive 0${idx + 1}</span>
                <div class="task-row">
                  <div class="task-text">• ${m.title}</div>
                  <a href="${m.link}" target="_blank" class="btn-go">INITIATE</a>
                </div>
                ${m.actionType === 'quote' ? `
                  <div class="input-group" style="margin-top: 15px; margin-bottom: 0;">
                    <label class="input-label">Your Quoted Tweet URL <span style="color:red;">*</span></label>
                    <input type="text" name="quotedTweet" placeholder="https://x.com/your-username/status/..." required style="margin-bottom: 0;">
                  </div>
                ` : ''}
                ${m.actionType === 'comment' ? `
                  <div class="input-group" style="margin-top: 15px; margin-bottom: 0;">
                    <label class="input-label" style="display: flex; flex-direction: column;">
                      <span>Where to comment: <a href="${m.link}" target="_blank" style="color: #00a2ff;">This Tweet</a></span>
                      <span style="margin-top: 8px;">Your Comment Link <span style="color:red;">*</span></span>
                    </label>
                    <input type="text" name="commentedTweet" placeholder="https://x.com/your-username/status/..." required style="margin-bottom: 0;">
                  </div>
                ` : ''}
              </div>
            `).join('')}

            <div class="input-group">
              <span class="step-indicator">Payment Gateway</span>
              <label class="input-label">0x Wallet Address <span style="color:red;">*</span></label>
              <input type="text" name="wallet" placeholder="0x..." required>
            </div>

            <button type="submit" class="btn-primary" style="font-size: 1.1rem; padding: 18px; margin-top: 10px;">Submit All Directives</button>
            <p style="font-size: 0.75rem; color: #999; text-align: center; margin-top: 15px; font-weight: 700;">SECURE TRANSMISSION CHANNEL | V2.0.1</p>
          </form>
        </div>
      </div>
    `;
  }

  res.send(layout('Dashboard', `
    <div style="text-align: center; margin-top: 20px;">
      <h1 style="font-size: 2rem; margin-bottom: 5px;">Welcome, ${user.username}</h1>
      <p style="color: #666; font-weight: 600;">Complete the tasks below to enter the whitelist</p>
    </div>
    ${dashboardContent}
  `, '', '', user));
});

// Submit wallet
app.post('/submit', (req, res) => {
  const { wallet, quotedTweet, commentedTweet } = req.body;
  const user = req.user;

  if (!user) return res.redirect('/');

  const GUILD_ID = process.env.DISCORD_GUILD_ID;
  const hasJoined = user.guilds && user.guilds.some(g => g.id === GUILD_ID);

  if (!hasJoined) {
    return res.send(layout('Join Required', `
      <div style="max-width: 500px; margin: 0 auto;">
        <div class="glass-card" style="text-align: center; border-color: #ff5555; margin-top: 40px;">
          <span class="step-indicator">Security Protocol</span>
          <h1 style="color: #ff5555; margin-bottom: 20px;">Access Forbidden</h1>
          <p style="margin-bottom: 30px; font-weight: 600; color: #666;">You must be a member of the 22 FROGS Discord server to submit your application.</p>
          <div style="display: flex; gap: 15px; justify-content: center;">
            <a href="https://discord.gg/5g6M2vT6W7" target="_blank" class="btn-go pulse" style="padding: 12px 25px; font-size: 0.9rem; background: #5865F2;">JOIN SERVER</a>
            <a href="/" class="btn-primary" style="padding: 12px 25px; font-size: 0.9rem; text-decoration: none; display: inline-block; width: auto; background: #f3f4f6; border-color: #ddd; color: #333; box-shadow: none;">RETRY</a>
          </div>
        </div>
      </div>
    `, '', '', user));
  }

  if (applications.some(app => app.id === user.id)) {
    return res.send(layout('Already Submitted', `
      <div style="max-width: 500px; margin: 0 auto;">
        <div class="glass-card" style="text-align: center; border-color: #ffdd00; margin-top: 40px;">
          <span class="step-indicator">System Check</span>
          <h1 style="color: #854d0e; margin-bottom: 20px;">Single Entry Only</h1>
          <p style="margin-bottom: 30px; font-weight: 600; color: #666;">An active transmission for your identify already exists in the system.</p>
          <a href="/" class="btn-primary" style="text-decoration: none; display: inline-block; background: #ffdd00;">RETURN TO DASHBOARD</a>
        </div>
      </div>
    `, '', '', user));
  }

  const initialEntry = {
    username: user.username,
    id: user.id,
    wallet: wallet,
    xUsername: extractXUsername(quotedTweet) !== 'N/A' ? extractXUsername(quotedTweet) : extractXUsername(commentedTweet),
    quotedTweet: Array.isArray(quotedTweet) ? quotedTweet.filter(u => u).join(', ') : (quotedTweet || 'N/A'),
    commentedTweet: Array.isArray(commentedTweet) ? commentedTweet.filter(u => u).join(', ') : (commentedTweet || 'N/A'),
    status: 'pending',
    chatXP: 0,
    socialXP: 50,
    completedMissions: missions.filter(m => m.location === 'registration').map(m => m.id),
    submittedAt: new Date().toISOString(),
    currentLevelRole: ROLES.TADPOLE
  };

  applications.push(initialEntry);
  saveApplications();

  // Assign the initial "Tadpole" role automatically
  assignDiscordRole(user.id, ROLES.TADPOLE);

  res.send(layout('Success', `
    <div style="max-width: 550px; margin: 0 auto;">
      <div class="glass-card" style="text-align: center; border-color: #00ff88; margin-top: 40px;">
        <span class="step-indicator" style="color: #22c55e;">Directive Success</span>
        <h1 class="gradient-text" style="margin-bottom: 20px;">Transmission Secured</h1>
        <p style="margin-bottom: 30px; font-weight: 600; color: #666;">Salutations <strong>${user.username}</strong>, your identity has been integrated. Your status is now <span style="color:#22c55e">TADPOLE</span>.</p>
        <div style="background: rgba(0, 0, 0, 0.05); padding: 20px; border-radius: 12px; font-family: monospace; margin-bottom: 30px; text-align: left; border-left: 5px solid #00ff88;">
          <div style="margin-bottom: 5px; font-size: 0.8rem; color: #999;">PAYMENT ADDRESS</div>
          <div style="font-weight: 800;">${wallet}</div>
        </div>
        <a href="/" class="btn-primary" style="text-decoration: none; display: inline-block;">ENTER DASHBOARD</a>
      </div>
    </div>
  `, '', '', user));
});

// Auth & Listen
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/'));

app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});

// Discord Bot Event: Message Award XP
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return; // Ignore DMs

  const userId = message.author.id;
  const app = applications.find(a => a.id === userId);

  if (app) {
    app.chatXP = (app.chatXP || 0) + 5;
    saveApplications();
    console.log(`✨ [XP] ${message.author.username} +5 XP (Message) | New Chat XP: ${app.chatXP}`);

    // Check for promotion and emit socket update
    await checkAndPromoteRole(userId);
  }
});

// Start Server & Bot
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

client.login(BOT_TOKEN).then(() => {
  console.log(`🤖 Bot logged in as ${client.user.tag}`);
}).catch(err => {
  console.error('❌ Discord login failed:', err);
});

server.listen(port, () => {
  console.log(`✅ Server live at http://localhost:${port}`);
  console.log("Admin: http://localhost:3000/admin-login (password: internxbt123)");
});
