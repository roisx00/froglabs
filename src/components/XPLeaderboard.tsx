'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function XPLeaderboard() {
    const { data: leaderboard, error } = useSWR('/api/leaderboard', fetcher, {
        refreshInterval: 10000 // refresh every 10 seconds for real-time feel
    });

    const isLoading = !leaderboard && !error;
    const users = leaderboard || [];

    return (
        <div className="glass-card" style={{ padding: '30px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>GLOBAL RANKINGS</h3>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '4px 0 0 0' }}>Top Active Agents</p>
                </div>
                <div style={{ fontSize: '1.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '8px 12px' }}>
                    🏆
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '32px 0', textTransform: 'uppercase', letterSpacing: '2px', animation: 'pulse 2s infinite' }}>
                        Synchronizing live feeds...
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '32px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        No agents detected.
                    </div>
                ) : (
                    users.map((user: any, index: number) => {
                        let rowStyle = {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            background: 'rgba(255, 255, 255, 0.4)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            transition: 'all 0.2s ease',
                        };
                        let rankColor = 'var(--text-muted)';

                        if (index === 0) {
                            rowStyle.background = 'rgba(212, 175, 55, 0.15)'; // Gold
                            rowStyle.border = '1px solid rgba(212, 175, 55, 0.4)';
                            rankColor = '#d4af37';
                        } else if (index === 1) {
                            rowStyle.background = 'rgba(192, 192, 192, 0.15)'; // Silver
                            rowStyle.border = '1px solid rgba(192, 192, 192, 0.4)';
                            rankColor = '#9a9a9a';
                        } else if (index === 2) {
                            rowStyle.background = 'rgba(205, 127, 50, 0.15)'; // Bronze
                            rowStyle.border = '1px solid rgba(205, 127, 50, 0.4)';
                            rankColor = '#cd7f32';
                        }

                        return (
                            <div key={index} style={rowStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 900, fontSize: '1rem', width: '28px', color: rankColor }}>
                                        #{user.rank}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                            {user.username}
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-violet)', marginRight: '6px' }}></span>
                                            {user.tier}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>
                                    {user.xp.toLocaleString('en-US')} XP
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

        </div>
    );
}
