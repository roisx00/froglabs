'use client';

import { useEffect, useState } from 'react';

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
        if (confirm('Approve this applicant?')) {
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

    if (loading) return <div className="container">Loading Control Center...</div>;

    return (
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div className="admin-header">
                <h1 className="gradient-text">Master Control</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="role-tag role-wl" style={{ border: 'none' }}>BOT ACTIVE</div>
                    <button onClick={() => { localStorage.removeItem('isAdmin'); window.location.href = '/'; }} className="btn-logout" style={{ border: 'none' }}>EXIT</button>
                </div>
            </div>

            <div className="dashboard-grid" style={{ marginBottom: '30px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-label">Total Applicants</div>
                    <div className="stat-value">{apps.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Approved</div>
                    <div className="stat-value" style={{ color: '#22c55e' }}>{apps.filter(a => a.status === 'approved').length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Active Missions</div>
                    <div className="stat-value" style={{ color: '#00a2ff' }}>{missions.length}</div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead style={{ background: '#f8f8f8' }}>
                            <tr>
                                <th>Applicant</th>
                                <th>Wallet</th>
                                <th>X Handle</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apps.map(app => (
                                <tr key={app.id}>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{app.username}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#999' }}>{app.id}</div>
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{app.wallet}</td>
                                    <td style={{ fontWeight: 800, color: '#00a2ff' }}>{app.xUsername}</td>
                                    <td>
                                        <span className={`badge badge-${app.status}`}>{app.status?.toUpperCase()}</span>
                                    </td>
                                    <td>
                                        {app.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button onClick={() => handleApprove(app.id)} className="role-tag role-wl" style={{ cursor: 'pointer' }}>Approve</button>
                                                <button onClick={() => handleReject(app.id)} className="role-tag role-mod" style={{ cursor: 'pointer' }}>Reject</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
