'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { signOut } from 'next-auth/react';
import ConsigliereAgent from '@/components/ConsigliereAgent';
import DailySpinWheel from '@/components/DailySpinWheel';
import XPLeaderboard from '@/components/XPLeaderboard';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ROLE_DISPLAY: Record<string, string> = {
    '1135140834581414088': 'TADPOLE',
    '1153652478508802068': 'RIBBIT RUNNER',
    '1149718327388811314': 'CROAK KNIGHT',
    '1155236969534726269': 'ROYAL RIBBIT',
    '1135129228183093308': 'RIBBITFATHER'
};

const DISCORD_THRESHOLDS = { RIBBIT_RUNNER: 1000, ROYAL_RIBBIT: 3000 };
const X_TASKS_THRESHOLD = 3000;
const TEN_MINUTES = 10 * 60 * 1000;

function formatXP(n: number) { return n.toLocaleString('en-US'); }

export default function Dashboard({ initialUser, initialApp, initialMissions }: any = {}) {
    const [user, setUser] = useState<any>(initialUser || null);
    const [missions, setMissions] = useState<any[]>(initialMissions || []);
    const [loading, setLoading] = useState(!initialUser && !initialApp);
    // missionStates: { [missionId]: { status: 'checking' | 'done', startTime: number } }
    const [missionStates, setMissionStates] = useState<Record<string, any>>({});
    const [tick, setTick] = useState(0); // used to re-render timers

    const { data: appData } = useSWR('/api/application', fetcher, {
        fallbackData: initialApp,
        refreshInterval: 5000
    });
    const app = appData || initialApp;

    // Load missionStates from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('dash_mission_states');
        if (saved) setMissionStates(JSON.parse(saved));
    }, []);

    // Fetch user/missions if not passed as props
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
                console.error('Dashboard fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [initialUser]);

    // Timer tick every second
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // Check if any 'checking' timers have expired - reward XP and mark done
    useEffect(() => {
        const now = Date.now();
        let changed = false;
        const updated = { ...missionStates };

        Object.entries(updated).forEach(([id, state]: [string, any]) => {
            if (state.status === 'checking' && now - state.startTime >= TEN_MINUTES) {
                updated[id] = { status: 'done', startTime: state.startTime };
                changed = true;
                // Fire-and-forget XP reward
                const mission = missions.find((m: any) => m.id === id);
                if (mission) {
                    fetch('/api/missions/complete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ missionId: id, xpReward: mission.xpReward })
                    }).catch(() => { });
                }
            }
        });

        if (changed) {
            setMissionStates(updated);
            localStorage.setItem('dash_mission_states', JSON.stringify(updated));
        }
    }, [tick, missionStates, missions]);

    const handleMissionExecute = (m: any) => {
        // Only start timer if not already started
        if (missionStates[m.id]) return;
        const newState = {
            ...missionStates,
            [m.id]: { status: 'checking', startTime: Date.now() }
        };
        setMissionStates(newState);
        localStorage.setItem('dash_mission_states', JSON.stringify(newState));
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '2px' }}>LOADING SYSTEM...</span>
        </div>
    );

    if (!user) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <a href="/" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>AUTHENTICATE TO CONTINUE</a>
        </div>
    );

    // XP data
    const socialXP = app?.socialXP || 0;
    const chatXP = app?.chatXP || 0;
    const totalXP = chatXP + socialXP;

    const xTasksProgress = Math.min((socialXP / X_TASKS_THRESHOLD) * 100, 100);
    const xTasksComplete = socialXP >= X_TASKS_THRESHOLD;
    const xTasksLabel = xTasksComplete ? 'CROAK KNIGHT UNLOCKED' : `${formatXP(socialXP)} / ${formatXP(X_TASKS_THRESHOLD)} XP`;

    let discordLabel: string, discordProgress: number, discordBarClass: string;
    if (chatXP < DISCORD_THRESHOLDS.RIBBIT_RUNNER) {
        discordLabel = `${formatXP(chatXP)} / ${formatXP(DISCORD_THRESHOLDS.RIBBIT_RUNNER)} XP - Stage 1`;
        discordProgress = (chatXP / DISCORD_THRESHOLDS.RIBBIT_RUNNER) * 100;
        discordBarClass = 'discord';
    } else if (chatXP < DISCORD_THRESHOLDS.ROYAL_RIBBIT) {
        discordLabel = `${formatXP(chatXP)} / ${formatXP(DISCORD_THRESHOLDS.ROYAL_RIBBIT)} XP - Stage 2`;
        discordProgress = ((chatXP - DISCORD_THRESHOLDS.RIBBIT_RUNNER) / (DISCORD_THRESHOLDS.ROYAL_RIBBIT - DISCORD_THRESHOLDS.RIBBIT_RUNNER)) * 100;
        discordBarClass = 'discord';
    } else {
        discordLabel = 'ROYAL RIBBIT UNLOCKED';
        discordProgress = 100;
        discordBarClass = 'complete';
    }

    const appStatus = app?.status;
    const isApproved = appStatus === 'approved';
    const isPending = appStatus === 'pending';
    const statusClass = isApproved ? 'approved' : isPending ? 'pending' : 'guest';
    const statusText = isApproved ? 'GTD MINT — APPROVED' : isPending ? 'APPLICATION UNDER REVIEW' : 'NO APPLICATION FILED';

    const currentRoleId = app?.currentLevelRole || '1135140834581414088';
    const currentRoleName = ROLE_DISPLAY[currentRoleId] || 'TADPOLE';

    const dashboardMissions = missions.filter((m: any) => m.location === 'dashboard');
    const alreadyCompleted: string[] = app?.completedMissions || [];

    return (
        <div style={{ paddingTop: '70px', paddingBottom: '60px' }}>
            <header>
                <div className="nav-brand">
                    <div className="logo-container">
                        <img src="/img/logo.png" alt="22 RIBBITS" style={{ height: '38px', width: '38px' }} />
                    </div>
                    <span className="nav-brand-text">22 Ribbit / User Panel</span>
                </div>
                <button onClick={() => window.location.href = '/dashboard/ai-arena'} className="btn-arena" style={{ marginRight: '12px' }}>AI Arena 🤖</button>
                <button onClick={() => signOut()} className="btn-logout">Sign Out</button>
            </header>

            <div className="container">
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {user.username}
                    </h1>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Discord Member — RibbitLabs Whitelist Program
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="dashboard-grid">
                    <div className="stat-card">
                        <div className="stat-label">Application Status</div>
                        <div className={`status-banner ${statusClass}`} style={{ padding: '10px 14px' }}>
                            <div className={`status-indicator ${statusClass}`}></div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: isApproved ? 'var(--accent-green)' : isPending ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
                                {statusText}
                            </span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Current Role</div>
                        <div className="stat-value" style={{ fontSize: '1.1rem' }}>
                            <span className="role-tag role-cyan">{currentRoleName}</span>
                        </div>
                        <div className="stat-sub">Active Discord rank</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total XP Earned</div>
                        <div className="stat-value">{formatXP(totalXP)}</div>
                        <div className="stat-sub">Tasks: {formatXP(socialXP)} &middot; Chat: {formatXP(chatXP)}</div>
                    </div>
                </div>

                {/* Engagement Features */}
                <div className="grid lg:grid-cols-2 gap-8 mb-8 mt-8">
                    <DailySpinWheel />
                    <XPLeaderboard />
                </div>

                {/* XP Progress */}
                <div className="xp-container">
                    <div className="xp-section-title">XP Progress</div>
                    <div className="xp-row">
                        <div className="xp-header">
                            <div className="xp-label">X Tasks Grind</div>
                            <div className="xp-count" style={{ color: xTasksComplete ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>{xTasksLabel}</div>
                        </div>
                        <div className="xp-bar-bg">
                            <div className={`xp-bar-fill ${xTasksComplete ? 'complete' : 'social'}`} style={{ width: `${xTasksProgress}%` }}></div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            Reach 3,000 XP to unlock Croak Knight role
                        </div>
                    </div>
                    <div className="xp-row">
                        <div className="xp-header">
                            <div className="xp-label">Discord Chat Grind</div>
                            <div className="xp-count" style={{ color: discordBarClass === 'complete' ? 'var(--accent-green)' : '#7c85f5' }}>{discordLabel}</div>
                        </div>
                        <div className="xp-bar-bg">
                            <div className={`xp-bar-fill ${discordBarClass}`} style={{ width: `${discordProgress}%` }}></div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            10 messages = 5 XP &mdash; Stage 1: 1,000 XP (Ribbit Runner) &mdash; Stage 2: 3,000 XP (Royal Ribbit)
                        </div>
                    </div>
                </div>

                {/* Dashboard Missions */}
                {dashboardMissions.length > 0 && (
                    <div className="mission-card">
                        <div className="mission-section-title">Active X Tasks</div>
                        {dashboardMissions.map((m: any) => {
                            const state = missionStates[m.id];
                            const isCompletedInDb = alreadyCompleted.includes(m.id);
                            const isDone = state?.status === 'done' || isCompletedInDb;
                            const isChecking = !isDone && state?.status === 'checking';

                            let countdownLabel = '';
                            if (isChecking && state?.startTime) {
                                const remaining = Math.max(0, TEN_MINUTES - (Date.now() - state.startTime));
                                const mins = Math.floor(remaining / 60000);
                                const secs = Math.floor((remaining % 60000) / 1000);
                                countdownLabel = `${mins}:${secs.toString().padStart(2, '0')}`;
                            }

                            return (
                                <div key={m.id} className="mission-item">
                                    <div className="mission-info">
                                        <h4>{m.title}</h4>
                                        <p>{m.type === 'social' ? 'X Intelligence Mission' : 'Community Task'}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                        <div className="mission-reward">+{m.xpReward} XP</div>
                                        {isDone ? (
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                                                DONE ✓
                                            </span>
                                        ) : isChecking ? (
                                            <span className="status-checking" style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>
                                                Checking manually ({countdownLabel})
                                            </span>
                                        ) : (
                                            <a
                                                href={m.link}
                                                target="_blank"
                                                className="btn-go"
                                                onClick={() => handleMissionExecute(m)}
                                            >
                                                Execute
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* How to Get WL Guide */}
                <div className="wl-guide">
                    <div className="wl-guide-title">How to Secure a GTD Mint Whitelist</div>
                    <div className="wl-path-grid">
                        <div className="wl-path-card">
                            <h4>Path A — X Tasks</h4>
                            <p>Complete active X tasks on the dashboard. Reach <strong style={{ color: 'var(--text-primary)' }}>3,000 Social XP</strong> to unlock the Croak Knight role.</p>
                        </div>
                        <div className="wl-path-card">
                            <h4>Path B — Discord Activity</h4>
                            <p>Chat in Discord. Every <strong style={{ color: 'var(--text-primary)' }}>10 messages earns 5 XP</strong>. Reach 1,000 XP for Ribbit Runner and 3,000 XP for Royal Ribbit.</p>
                        </div>
                        <div className="wl-path-card">
                            <h4>Path C — Submit Application</h4>
                            <p>Submit your application with wallet address and proof of tasks. The team reviews and approves at any time.</p>
                        </div>
                        <div className="wl-path-card">
                            <h4>Manual Approval</h4>
                            <p>If your application shows <strong style={{ color: 'var(--accent-amber)' }}>UNDER REVIEW</strong>, our team will action it shortly. Approved accounts receive GTD Mint immediately.</p>
                        </div>
                    </div>
                    <div className="wl-note">
                        <strong>Note:</strong> All paths contribute independently. XP thresholds grant automatic role upgrades. Manual approval covers final GTD Mint allocation.
                    </div>
                </div>

                <footer>
                    <span className="footer-text">powered by 22ribbits</span>
                </footer>
            </div>
            <ConsigliereAgent app={app} />
        </div>
    );
}
