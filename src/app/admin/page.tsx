'use client';

import { useEffect, useState } from 'react';

const ROLE_DISPLAY: Record<string, string> = {
    '1135140834581414088': 'TADPOLE',
    '1153652478508802068': 'FROG RUNNER',
    '1149718327388811314': 'CROAK KNIGHT',
    '1155236969534726269': 'ROYAL RIBBIT',
    '1135129228183093308': 'FROGFATHER'
};

const BLANK_TASK = { title: '', link: '', xpReward: '50', type: 'social', actionType: 'quote' };

export default function AdminPanel() {
    const [apps, setApps] = useState<any[]>([]);
    const [missions, setMissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    // Task management state
    const [activeTab, setActiveTab] = useState<'applications' | 'registration' | 'dashboard'>('applications');
    const [newTask, setNewTask] = useState({ ...BLANK_TASK });
    const [savingTask, setSavingTask] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('isAdmin') !== 'true') {
            window.location.href = '/admin-login';
            return;
        }
        fetchAll();
    }, []);

    const fetchAll = async () => {
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

    const handleApprove = async (id: string) => {
        if (!confirm('Approve this applicant for GTD Mint?')) return;
        await fetch(`/api/admin/approve/${id}`, { method: 'POST' });
        fetchAll();
    };

    const handleReject = async (id: string) => {
        if (!confirm('Reject this applicant?')) return;
        await fetch(`/api/admin/reject/${id}`, { method: 'POST' });
        fetchAll();
    };

    const handleAddTask = async (location: 'registration' | 'dashboard') => {
        if (!newTask.title.trim() || !newTask.link.trim()) return alert('Title and link are required.');
        setSavingTask(true);
        try {
            await fetch('/api/admin/missions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newTask, location })
            });
            setNewTask({ ...BLANK_TASK });
            await fetchAll();
        } finally {
            setSavingTask(false);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm('Delete this task?')) return;
        await fetch(`/api/admin/missions?id=${id}`, { method: 'DELETE' });
        await fetchAll();
    };

    const exportCSV = () => {
        const ROLE_ORDER = [
            { id: '1135129228183093308', name: 'FROGFATHER' },
            { id: '1155236969534726269', name: 'ROYAL RIBBIT' },
            { id: '1149718327388811314', name: 'CROAK KNIGHT' },
            { id: '1153652478508802068', name: 'FROG RUNNER' },
            { id: '1135140834581414088', name: 'TADPOLE' },
        ];

        const rows: string[] = ['Role,Discord Username,Discord ID,Wallet Address,X Handle,Chat XP,Task XP,Total XP,Status,Submitted At'];

        for (const role of ROLE_ORDER) {
            const group = apps.filter(a => a.currentLevelRole === role.id);
            if (group.length === 0) continue;
            rows.push(`\n=== ${role.name} (${group.length}) ===`);
            for (const a of group) {
                const chatXP = a.chatXP || 0;
                const socialXP = a.socialXP || 0;
                rows.push([
                    role.name,
                    `"${a.username || ''}"`,
                    a.id || '',
                    `"${a.wallet || ''}"`,
                    `"${a.xUsername || ''}"`,
                    chatXP,
                    socialXP,
                    chatXP + socialXP,
                    a.status || 'pending',
                    `"${a.submittedAt || ''}"`
                ].join(','));
            }
        }

        // Also add a GTD MINT section (approved only)
        const approved = apps.filter(a => a.status === 'approved');
        if (approved.length > 0) {
            rows.push(`\n=== GTD MINT APPROVED (${approved.length}) ===`);
            for (const a of approved) {
                rows.push(`"${a.username || ''}",${a.id || ''},"${a.wallet || ''}","${a.xUsername || ''}",${a.status}`);
            }
        }

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `froglabs-wallets-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
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
    const rejectedCount = apps.filter(a => a.status === 'rejected').length;

    const filteredApps = apps.filter(app => {
        const q = searchTerm.toLowerCase();
        const matchesSearch = !q ||
            (app.username || '').toLowerCase().includes(q) ||
            (app.wallet || '').toLowerCase().includes(q) ||
            (app.xUsername || '').toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const regTasks = missions.filter(m => m.location === 'registration');
    const dashTasks = missions.filter(m => m.location === 'dashboard');

    // Shared task form component inline
    const TaskForm = ({ location }: { location: 'registration' | 'dashboard' }) => (
        <div className="glass-card" style={{ marginTop: '20px' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
                    Add New {location === 'registration' ? 'Registration' : 'Dashboard'} Task
                </span>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Task Title *</label>
                        <input
                            type="text"
                            placeholder="e.g. Quote our pinned tweet"
                            value={newTask.title}
                            onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Link (X.com URL) *</label>
                        <input
                            type="text"
                            placeholder="https://x.com/..."
                            value={newTask.link}
                            onChange={e => setNewTask(t => ({ ...t, link: e.target.value }))}
                        />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">XP Reward</label>
                        <input
                            type="number"
                            min="1"
                            value={newTask.xpReward}
                            onChange={e => setNewTask(t => ({ ...t, xpReward: e.target.value }))}
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Type</label>
                        <select
                            value={newTask.type}
                            onChange={e => setNewTask(t => ({ ...t, type: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '2px solid var(--text-primary)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                        >
                            <option value="social">Social (X Task)</option>
                            <option value="community">Community</option>
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Action Type</label>
                        <select
                            value={newTask.actionType}
                            onChange={e => setNewTask(t => ({ ...t, actionType: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-card)', border: '2px solid var(--text-primary)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                        >
                            <option value="quote">Quote Tweet</option>
                            <option value="comment">Comment</option>
                            <option value="retweet">Retweet</option>
                            <option value="follow">Follow</option>
                            <option value="like">Like</option>
                            <option value="none">None (no proof needed)</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => handleAddTask(location)}
                    disabled={savingTask}
                    className="btn-primary"
                    style={{ alignSelf: 'flex-start', padding: '10px 28px', fontSize: '0.85rem' }}
                >
                    {savingTask ? 'Adding...' : '+ Add Task'}
                </button>
            </div>

            {/* Task list for this location */}
            {(location === 'registration' ? regTasks : dashTasks).length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ padding: '14px 24px 6px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                        Active Tasks ({(location === 'registration' ? regTasks : dashTasks).length})
                    </div>
                    {(location === 'registration' ? regTasks : dashTasks).map((task: any) => (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{task.title}</div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent-cyan)' }}>{task.actionType?.toUpperCase()}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--accent-green)' }}>+{task.xpReward} XP</span>
                                    <a href={task.link} target="_blank" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                                        {task.link.length > 40 ? task.link.slice(0, 40) + '...' : task.link} ↗
                                    </a>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteTask(task.id)}
                                style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700,
                                    padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
                                    background: 'rgba(164,22,26,0.1)', border: '1.5px solid var(--accent-red)',
                                    color: 'var(--accent-red)', textTransform: 'uppercase', flexShrink: 0
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {(location === 'registration' ? regTasks : dashTasks).length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
                    No {location} tasks yet. Add one above.
                </div>
            )}
        </div>
    );

    const tabStyle = (tab: string) => ({
        fontFamily: 'var(--font-mono)',
        fontSize: '0.68rem',
        fontWeight: 700,
        padding: '8px 20px',
        borderRadius: '6px 6px 0 0',
        border: '2px solid var(--text-primary)',
        borderBottom: activeTab === tab ? '2px solid var(--bg-base)' : '2px solid var(--text-primary)',
        cursor: 'pointer',
        background: activeTab === tab ? 'var(--bg-base)' : 'transparent',
        color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        transition: 'var(--transition)',
        marginBottom: '-2px',
        position: 'relative' as const,
        zIndex: activeTab === tab ? 2 : 1
    });

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
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
                        onClick={exportCSV}
                        style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700,
                            padding: '6px 14px', borderRadius: '4px', cursor: 'pointer',
                            background: 'rgba(45,106,79,0.15)', border: '1.5px solid var(--accent-green)',
                            color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px'
                        }}
                    >
                        ↓ Export CSV
                    </button>
                    <button
                        onClick={() => { localStorage.removeItem('isAdmin'); window.location.href = '/'; }}
                        className="btn-logout"
                    >
                        Exit
                    </button>
                </div>
            </header>

            <div className="container" style={{ maxWidth: '1200px', paddingTop: '80px' }}>
                {/* Title */}
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        Master Control Panel
                    </h1>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Application Management — FrogLabs WL Program
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '28px' }}>
                    <div className="stat-card">
                        <div className="stat-label">Total Applicants</div>
                        <div className="stat-value">{apps.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Pending Review</div>
                        <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{pendingCount}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Approved (GTD)</div>
                        <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{approvedCount}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Rejected</div>
                        <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{rejectedCount}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid var(--text-primary)', marginBottom: '24px' }}>
                    <button style={tabStyle('applications')} onClick={() => setActiveTab('applications')}>
                        Applications ({apps.length})
                    </button>
                    <button style={tabStyle('registration')} onClick={() => setActiveTab('registration')}>
                        Registration Tasks ({regTasks.length})
                    </button>
                    <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
                        Dashboard Tasks ({dashTasks.length})
                    </button>
                </div>

                {/* === APPLICATIONS TAB === */}
                {activeTab === 'applications' && (
                    <>
                        {/* Search & Filter */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                                <label className="input-label" style={{ fontSize: '0.65rem' }}>Search</label>
                                <input
                                    type="text"
                                    placeholder="Name, wallet, or X handle..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '6px', paddingBottom: '2px' }}>
                                {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        style={{
                                            fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700,
                                            padding: '5px 12px', borderRadius: '4px',
                                            border: '1.5px solid var(--text-primary)', cursor: 'pointer',
                                            textTransform: 'uppercase',
                                            background: statusFilter === s ? 'var(--text-primary)' : 'transparent',
                                            color: statusFilter === s ? 'var(--bg-base)' : 'var(--text-primary)',
                                            transition: 'var(--transition)'
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
                                    Applications
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    {filteredApps.length} / {apps.length} shown
                                </span>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Applicant</th>
                                            <th>Wallet</th>
                                            <th>X Handle</th>
                                            <th>Task Proof</th>
                                            <th>Role</th>
                                            <th>Chat XP</th>
                                            <th>Task XP</th>
                                            <th>Total XP</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredApps.map(app => {
                                            const chatXP = app.chatXP || 0;
                                            const socialXP = app.socialXP || 0;
                                            const totalXP = chatXP + socialXP;
                                            const roleName = ROLE_DISPLAY[app.currentLevelRole] || 'TADPOLE';
                                            return (
                                                <tr key={app.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.username}</div>
                                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px' }}>{app.id}</div>
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {app.wallet || '—'}
                                                    </td>
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                                        {app.xUsername || '—'}
                                                    </td>
                                                    <td style={{ fontSize: '0.72rem' }}>
                                                        {app.quotedTweet && (
                                                            <a href={app.quotedTweet} target="_blank" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', display: 'block' }}>Quote ↗</a>
                                                        )}
                                                        {app.commentedTweet && (
                                                            <a href={app.commentedTweet} target="_blank" style={{ color: 'var(--accent-violet)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', display: 'block' }}>Comment ↗</a>
                                                        )}
                                                        {!app.quotedTweet && !app.commentedTweet && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                    </td>
                                                    <td><span className="role-tag role-cyan">{roleName}</span></td>
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7c85f5', fontWeight: 700 }}>{chatXP.toLocaleString()}</td>
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{socialXP.toLocaleString()}</td>
                                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalXP.toLocaleString()}</td>
                                                    <td><span className={`badge badge-${app.status || 'pending'}`}>{(app.status || 'pending').toUpperCase()}</span></td>
                                                    <td>
                                                        {app.status === 'pending' && (
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                <button onClick={() => handleApprove(app.id)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', background: 'rgba(45,106,79,0.15)', border: '1.5px solid var(--accent-green)', color: 'var(--accent-green)', textTransform: 'uppercase' }}>Approve</button>
                                                                <button onClick={() => handleReject(app.id)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', background: 'rgba(164,22,26,0.1)', border: '1.5px solid var(--accent-red)', color: 'var(--accent-red)', textTransform: 'uppercase' }}>Reject</button>
                                                            </div>
                                                        )}
                                                        {app.status === 'approved' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent-green)', fontWeight: 700 }}>GTD MINT ✓</span>}
                                                        {app.status === 'rejected' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--accent-red)' }}>REJECTED</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredApps.length === 0 && (
                                            <tr>
                                                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '2px' }}>
                                                    {apps.length === 0 ? 'NO APPLICATIONS YET' : 'NO RESULTS FOUND'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* === REGISTRATION TASKS TAB === */}
                {activeTab === 'registration' && (
                    <div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            These tasks appear on the <strong>Registration page</strong> — users must complete them before submitting their application.
                        </p>
                        <TaskForm location="registration" />
                    </div>
                )}

                {/* === DASHBOARD TASKS TAB === */}
                {activeTab === 'dashboard' && (
                    <div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            These tasks appear on the <strong>Dashboard</strong> — users complete them to earn Social XP toward the Croak Knight role.
                        </p>
                        <TaskForm location="dashboard" />
                    </div>
                )}
            </div>

            <footer>
                <span className="footer-text">powered by 22frogs</span>
            </footer>
        </div>
    );
}
