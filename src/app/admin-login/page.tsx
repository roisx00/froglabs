'use client';

import { useState } from 'react';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'isra98@A') {
            localStorage.setItem('isAdmin', 'true');
            window.location.href = '/admin';
        } else {
            setError('Invalid administrator credentials detected.');
        }
    };

    return (
        <div className="container">
            <div className="glass-card" style={{ maxWidth: '450px', margin: '100px auto' }}>
                <h1 className="gradient-text" style={{ marginBottom: '30px', textAlign: 'center' }}>Admin Access</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="Enter admin password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Login to Dashboard
                    </button>
                    {error && <p style={{ color: '#ff5555', marginTop: '10px', textAlign: 'center' }}>{error}</p>}
                </form>
            </div>
        </div>
    );
}
