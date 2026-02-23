'use client';

import { useEffect, useState } from 'react';

const ROLE_DISPLAY: Record<string, string> = {
    '1135140834581414088': 'TADPOLE',
    '1153652478508802068': 'FROG RUNNER',
    '1149718327388811314': 'CROAK KNIGHT',
    '1155236969534726269': 'ROYAL RIBBIT',
    '1135129228183093308': 'FROGFATHER'
};

export default function AdminPanel() {
    const [apps, setApps] = useState<any[]>([]);
    const [missions, setMissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (localStorage.getItem('isAdmin') !== 'true') {
            window.location.href = '/admin-login';
            return;
        }

        const fetchData = async () => {
            try {
                const [appsRes, missionsRes] = await Promise.all([
                    fetch('/api/admin/applications'),
                    fetch('/api/missions')
                ]);
                setApps(await appsRes.json());
                setMissions(await missionsRes.json());
            } catch (err) {
                console.error('Admin fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleApprove = async (id: string) => {
        if (confirm('Approve this applicant for GTD Mint?')) {
            await fetch(`/api/admin/approve/${id}`, { method: 'POST' });
            window.location.reload();
        }
    };

    const handleReject = async (id: string) => {
        if (confirm('Reject this applicant?')) {
            await fetch(`/api/admin/reject/${id}`, { method: 'POST' });
            window.location.reload();
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '2px' }}>
                LOADING CONTROL CENTER...
            </span>
        </div>
    );

    const approvedCount = apps.filter(a => a.status === 'approved').length;
    const pendingCount = apps.filter(a => a.status === 'pending').length;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
            {/* Header */}
            <header>
                <div className="nav-brand">
                    <div className="logo-container">
                        <img src="/img/logo.png" alt="22 FROGS" style={{ height: '38px', width: '38px' }} />
                    </div>
                    <span className="nav-brand-text">22 Frogs / Admin Control</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className="role-tag role-wl">Bot Active</span>
                    <button
                        onClick={() => { localStorage.removeItem('isAdmin'); window.location.href = '/'; }}
                        className="btn-logout"
                    >
                        Exit
                    </button>
                </div>
            </header>

            <div className="container" style={{ maxWidth: '1200px', paddingTop: '80px' }}>
                {/* Admin header */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 className="gradient-text" style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '4px' }}>
                        Master Control Panel
                    </h1>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Application Management — FrogLabs WL Program
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '28px' }}>
                    <div className="stat-card">
                        <div className="stat-label">Total Applicants</div>
                        <div className="stat-value">{apps.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Approved (GTD Mint)</div>
                        <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{approvedCount}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Pending Review</div>
                        <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{pendingCount}</div>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
                            All Applications
                        </span>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Applicant</th>
                                    <th>Wallet</th>
                                    <th>X Handle</th>
                                    <th>Role</th>
                                    <th>Chat XP</th>
                                    <th>Task XP</th>
                                    <th>Total XP</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {apps.map(app => {
                                    const chatXP = app.chatXP || 0;
                                    const socialXP = app.socialXP || 0;
                                    const totalXP = chatXP + socialXP;
                                    const roleName = ROLE_DISPLAY[app.currentLevelRole] || 'TADPOLE';

                                    return (
                                        <tr key={app.id}>
                                            <td>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.username}</div>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{app.id}</div>
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {app.wallet}
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                                {app.xUsername || '—'}
                                            </td>
                                            <td>
                                                <span className="role-tag role-cyan">{roleName}</span>
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7c85f5', fontWeight: 700 }}>
                                                {chatXP.toLocaleString()}
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                                {socialXP.toLocaleString()}
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                {totalXP.toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${app.status}`}>{app.status?.toUpperCase()}</span>
                                            </td>
                                            <td>
                                                {app.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            onClick={() => handleApprove(app.id)}
                                                            className="role-tag role-wl"
                                                            style={{ cursor: 'pointer', background: 'rgba(34,211,160,0.15)', border: '1px solid rgba(34,211,160,0.4)' }}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(app.id)}
                                                            className="role-tag role-mod"
                                                            style={{ cursor: 'pointer', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)' }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {app.status === 'approved' && (
                                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent-green)' }}>GTD MINT</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {apps.length === 0 && (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '2px' }}>
                                            NO APPLICATIONS YET
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mission count */}
                {missions.length > 0 && (
                    <div style={{ marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right', letterSpacing: '1px' }}>
                        {missions.length} active mission{missions.length !== 1 ? 's' : ''} configured
                    </div>
                )}
            </div>
            {/* Footer */}
            <footer>
                <span className="footer-text">powered by 22frogs</span>
            </footer>
        </div>
    );
}
