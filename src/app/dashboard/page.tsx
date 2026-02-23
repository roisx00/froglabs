'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { signOut } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Role hierarchy display names
const ROLE_DISPLAY: Record<string, string> = {
    '1135140834581414088': 'TADPOLE',
    '1153652478508802068': 'FROG RUNNER',
    '1149718327388811314': 'CROAK KNIGHT',
    '1155236969534726269': 'ROYAL RIBBIT',
    '1135129228183093308': 'FROGFATHER'
};

// Discord XP rate: 10 messages = 5 XP => 0.5 XP per message
// Thresholds remain the same in XP terms
const DISCORD_THRESHOLDS = {
    FROG_RUNNER: 1000, // XP required
    ROYAL_RIBBIT: 3000  // XP required
};

const X_TASKS_THRESHOLD = 3000;

function formatXP(n: number) {
    return n.toLocaleString();
}

export default function Dashboard({ initialUser, initialApp, initialMissions }: any = {}) {
    const [user, setUser] = useState<any>(initialUser || null);
    const [missions, setMissions] = useState<any[]>(initialMissions || []);
    const { data: appData } = useSWR('/api/application', fetcher, {
        fallbackData: initialApp,
        refreshInterval: 3000
    });

    const app = appData || initialApp;
    const [loading, setLoading] = useState(!initialUser && !app);

    useEffect(() => {
        if (initialUser) return;

        const fetchData = async () => {
            try {
                const [userRes, missionsRes] = await Promise.all([
                    fetch('/api/user'),
                    fetch('/api/missions')
                ]);
                setUser(await userRes.json());
                setMissions(await missionsRes.json());
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '2px' }}>LOADING SYSTEM...</span>
        </div>
    );

    if (!user) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <a href="/auth/discord" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>AUTHENTICATE TO CONTINUE</a>
        </div>
    );

    // --- XP Data ---
    const socialXP = app?.socialXP || 0;
    const chatXP = app?.chatXP || 0;
    const totalXP = chatXP + socialXP;

    // X Tasks progress
    const xTasksProgress = Math.min((socialXP / X_TASKS_THRESHOLD) * 100, 100);
    const xTasksComplete = socialXP >= X_TASKS_THRESHOLD;
    const xTasksLabel = xTasksComplete
        ? 'CROAK KNIGHT UNLOCKED'
        : `${formatXP(socialXP)} / ${formatXP(X_TASKS_THRESHOLD)} XP`;

    // Discord chat progress (multi-stage)
    let discordLabel: string, discordProgress: number, discordBarClass: string;
    if (chatXP < DISCORD_THRESHOLDS.FROG_RUNNER) {
        discordLabel = `${formatXP(chatXP)} / ${formatXP(DISCORD_THRESHOLDS.FROG_RUNNER)} XP - Stage 1`;
        discordProgress = (chatXP / DISCORD_THRESHOLDS.FROG_RUNNER) * 100;
        discordBarClass = 'discord';
    } else if (chatXP < DISCORD_THRESHOLDS.ROYAL_RIBBIT) {
        discordLabel = `${formatXP(chatXP)} / ${formatXP(DISCORD_THRESHOLDS.ROYAL_RIBBIT)} XP - Stage 2`;
        discordProgress = ((chatXP - DISCORD_THRESHOLDS.FROG_RUNNER) / (DISCORD_THRESHOLDS.ROYAL_RIBBIT - DISCORD_THRESHOLDS.FROG_RUNNER)) * 100;
        discordBarClass = 'discord';
    } else {
        discordLabel = 'ROYAL RIBBIT UNLOCKED';
        discordProgress = 100;
        discordBarClass = 'complete';
    }

    // --- Application status ---
    const appStatus = app?.status;
    const isApproved = appStatus === 'approved';
    const isPending = appStatus === 'pending';

    const statusClass = isApproved ? 'approved' : isPending ? 'pending' : 'guest';
    const statusText = isApproved ? 'GTD MINT — APPROVED' : isPending ? 'APPLICATION UNDER REVIEW' : 'NO APPLICATION FILED';

    // --- Current Role ---
    const currentRoleId = app?.currentLevelRole || '1135140834581414088';
    const currentRoleName = ROLE_DISPLAY[currentRoleId] || 'TADPOLE';

    // --- Missions ---
    const dashboardMissions = missions.filter((m: any) => m.location === 'dashboard');

    return (
        <div style={{ paddingTop: '70px', paddingBottom: '60px' }}>
            {/* ——— HEADER ——— */}
            <header>
                <div className="nav-brand">
                    <div className="logo-container">
                        <img src="/img/logo.png" alt="22 FROGS" style={{ height: '38px', width: '38px' }} />
                    </div>
                    <span className="nav-brand-text">22 Frogs / User Panel</span>
                </div>
                <button onClick={() => signOut()} className="btn-logout">Sign Out</button>
            </header>

            <div className="container">
                {/* ——— PAGE TITLE ——— */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {user.username}
                    </h1>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Discord Member — FrogLabs Whitelist Program
                    </p>
                </div>

                {/* ——— STAT CARDS ——— */}
                <div className="dashboard-grid">
                    {/* Status card */}
                    <div className="stat-card">
                        <div className="stat-label">Application Status</div>
                        <div>
                            <div className={`status-banner ${statusClass}`} style={{ padding: '10px 14px', marginBottom: '0' }}>
                                <div className={`status-indicator ${statusClass}`}></div>
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: isApproved ? 'var(--accent-green)' : isPending ? 'var(--accent-amber)' : 'var(--text-secondary)'
                                }}>
                                    {statusText}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Current Role card */}
                    <div className="stat-card">
                        <div className="stat-label">Current Role</div>
                        <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                            <span className="role-tag role-cyan">{currentRoleName}</span>
                        </div>
                        <div className="stat-sub">Active Discord rank</div>
                    </div>

                    {/* Total XP card */}
                    <div className="stat-card">
                        <div className="stat-label">Total XP Earned</div>
                        <div className="stat-value gradient-text">{formatXP(totalXP)}</div>
                        <div className="stat-sub">Tasks: {formatXP(socialXP)} &middot; Chat: {formatXP(chatXP)}</div>
                    </div>
                </div>

                {/* ——— XP PROGRESS ——— */}
                <div className="xp-container">
                    <div className="xp-section-title">XP Progress</div>

                    {/* X Tasks */}
                    <div className="xp-row">
                        <div className="xp-header">
                            <div className="xp-label">X Tasks Grind</div>
                            <div className="xp-count" style={{ color: xTasksComplete ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>
                                {xTasksLabel}
                            </div>
                        </div>
                        <div className="xp-bar-bg">
                            <div className={`xp-bar-fill ${xTasksComplete ? 'complete' : 'social'}`} style={{ width: `${xTasksProgress}%` }}></div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            Reach 3,000 XP to unlock Croak Knight role
                        </div>
                    </div>

                    {/* Discord Chat */}
                    <div className="xp-row">
                        <div className="xp-header">
                            <div className="xp-label">Discord Chat Grind</div>
                            <div className="xp-count" style={{ color: discordBarClass === 'complete' ? 'var(--accent-green)' : '#7c85f5' }}>
                                {discordLabel}
                            </div>
                        </div>
                        <div className="xp-bar-bg">
                            <div className={`xp-bar-fill ${discordBarClass}`} style={{ width: `${discordProgress}%` }}></div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            10 messages = 5 XP &mdash; Stage 1: 1,000 XP (Frog Runner) &mdash; Stage 2: 3,000 XP (Royal Ribbit)
                        </div>
                    </div>
                </div>

                {/* ——— DASHBOARD MISSIONS ——— */}
                {dashboardMissions.length > 0 && (
                    <div className="mission-card">
                        <div className="mission-section-title">Active X Tasks</div>
                        {dashboardMissions.map((m: any) => (
                            <div key={m.id} className="mission-item">
                                <div className="mission-info">
                                    <h4>{m.title}</h4>
                                    <p>{m.type === 'social' ? 'X Intelligence Mission' : 'Community Task'}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                    <div className="mission-reward">+{m.xpReward} XP</div>
                                    <a href={m.link} target="_blank" className="btn-go">Execute</a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ——— HOW TO GET WL GUIDE ——— */}
                <div className="wl-guide">
                    <div className="wl-guide-title">How to Secure a GTD Mint Whitelist</div>

                    <div className="wl-path-grid">
                        <div className="wl-path-card">
                            <h4>Path A — X Tasks</h4>
                            <p>
                                Complete all active X tasks on the dashboard. Each task contributes XP toward your Social score.
                                Reach <strong style={{ color: 'var(--text-primary)' }}>3,000 Social XP</strong> to automatically unlock the Croak Knight role.
                            </p>
                        </div>
                        <div className="wl-path-card">
                            <h4>Path B — Discord Activity</h4>
                            <p>
                                Send messages in the general Discord server chat. Every
                                <strong style={{ color: 'var(--text-primary)' }}> 10 messages earns 5 XP</strong>. Accumulate
                                <strong style={{ color: 'var(--text-primary)' }}> 1,000 XP</strong> for Frog Runner and
                                <strong style={{ color: 'var(--text-primary)' }}> 3,000 XP</strong> for Royal Ribbit.
                            </p>
                        </div>
                        <div className="wl-path-card">
                            <h4>Path C — Submit Application</h4>
                            <p>
                                Submit your application with your wallet address and proof of tasks. Applications are reviewed manually by the team and can be approved at any time.
                            </p>
                        </div>
                        <div className="wl-path-card">
                            <h4>Manual Approval</h4>
                            <p>
                                The team reserves the right to approve applications directly.
                                If your application shows <strong style={{ color: 'var(--accent-amber)' }}>UNDER REVIEW</strong>, our team will action it shortly.
                                Approved accounts receive the GTD Mint designation immediately.
                            </p>
                        </div>
                    </div>

                    <div className="wl-note">
                        <strong>Note:</strong> All three paths contribute independently. Reaching XP thresholds via Discord chat or X tasks grants automatic role upgrades. Manual approval covers the final GTD Mint allocation regardless of XP level. Grinding both paths maximizes your chances.
                    </div>
                </div>
                <footer>
                    <span className="footer-text">powered by 22frogs</span>
                </footer>
            </div>
        </div>
    );
}
