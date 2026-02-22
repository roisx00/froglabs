'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [app, setApp] = useState<any>(null);
    const [missions, setMissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, missionsRes] = await Promise.all([
                    fetch('/api/user'),
                    fetch('/api/missions')
                ]);

                const userData = await userRes.json();
                const missionsData = await missionsRes.json();

                setUser(userData);
                setMissions(missionsData);

                if (userData) {
                    const appRes = await fetch('/api/application');
                    const appData = await appRes.json();
                    setApp(appData);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!user) return;

        const socket = io();

        socket.on('xpUpdate', (data: any) => {
            if (data.userId !== user.id) return;
            setApp((prev: any) => ({ ...prev, ...data }));
        });

        socket.on('roleUpdate', (data: any) => {
            if (data.userId !== user.id) return;
            // In a real app we might refetch or update roles array
            window.location.reload();
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
    if (!user) return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>Please <a href="/auth/discord">login</a> to continue.</div>;

    const ROLES: Record<string, string> = {
        '1135140834581414088': 'TADPOLE',
        '1153652478508802068': 'FROG RUNNER',
        '1149718327388811314': 'CROAK KNIGHT',
        '1155236969534726269': 'ROYAL RIBBIT',
        '1135129228183093308': 'FROGFATHER'
    };

    const socialXP = app?.socialXP || 0;
    const chatXP = app?.chatXP || 0;
    const totalXP = chatXP + socialXP;

    const xTasksProgress = Math.min((socialXP / 3000) * 100, 100);
    const xRoleLabel = socialXP >= 3000 ? '✅ CROAK KNIGHT UNLOCKED' : `${socialXP} / 3000 XP → Croak Knight`;

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

    const dashboardMissions = missions.filter(m => m.location === 'dashboard');

    return (
        <div className="container" style={{ paddingTop: '80px' }}>
            <header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="logo-container">
                        <img src="/img/logo.png" alt="22 FROGS" style={{ height: '42px', width: '42px', borderRadius: '50%', border: '2px solid black' }} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>User Panel</span>
                </div>
                <a href="/logout" className="btn-logout">Sign Out</a>
            </header>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '5px' }}>Welcome, {user.username}</h1>
                <p style={{ color: '#666', fontWeight: 600 }}>Complete the tasks below to enter the whitelist</p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '50px' }}>
                <div className="dashboard-grid">
                    <div className="stat-card">
                        <div className="stat-label">Identity Level</div>
                        <div className="stat-value" style={{ color: app?.status === 'approved' ? '#22c55e' : '#ffdd00' }}>
                            {app?.status === 'approved' ? 'GTD MINT' : (app?.status === 'pending' ? 'PENDING REVIEW' : (app?.status || 'GUEST'))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px' }}>Total XP: {totalXP}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Discord Status</div>
                        <div className="stat-value" style={{ fontSize: '1.1rem' }}>{user.username}</div>
                        <div className="badge-gallery" style={{ marginTop: '10px' }}>
                            {/* Simplified roles for now */}
                            <span className="role-tag role-wl">TADPOLE</span>
                        </div>
                    </div>
                </div>

                <div className="xp-container" style={{ marginTop: '25px' }}>
                    <div className="xp-row">
                        <div className="xp-header">
                            <div className="xp-label">⚡ X Tasks Grind</div>
                            <div className="xp-count">{xRoleLabel}</div>
                        </div>
                        <div className="xp-bar-bg">
                            <div className="xp-bar-fill social" style={{ width: `${xTasksProgress}%` }}></div>
                        </div>
                    </div>

                    <div className="xp-row" style={{ marginTop: '20px' }}>
                        <div className="xp-header">
                            <div className="xp-label">💬 Discord Grinding</div>
                            <div className="xp-count">{discordStageLabel}</div>
                        </div>
                        <div className="xp-bar-bg">
                            <div className="xp-bar-fill discord" style={{ width: `${discordProgress}%`, background: discordBarColor }}></div>
                        </div>
                    </div>
                </div>

                <div className="mission-card">
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.9rem', color: '#666' }}>Dashboard X Tasks</h3>
                    {dashboardMissions.map((m: any) => (
                        <div key={m.id} className="mission-item">
                            <div className="mission-info">
                                <h4>{m.title}</h4>
                                <p>{m.type === 'social' ? 'X Intelligence Mission' : 'Community Enlistment'}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="mission-reward">+{m.xpReward} XP</div>
                                <a href={m.link} target="_blank" className="btn-go">INITIATE</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
