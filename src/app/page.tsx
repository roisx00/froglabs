'use client';

import { useEffect, useState } from 'react';
import Dashboard from './dashboard/page';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const loadingSession = status === 'loading';

  const [app, setApp] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loadingSession) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [missionsRes, appRes] = await Promise.all([
          fetch('/api/missions'),
          fetch('/api/application')
        ]);
        setMissions(await missionsRes.json());
        const appData = await appRes.json();
        setApp(appData || false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, loadingSession]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      userId: user.id,
      username: user.username,
      wallet: formData.get('wallet'),
      quotedTweet: formData.get('quotedTweet'),
      commentedTweet: formData.get('commentedTweet'),
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    } catch {
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading states
  if (loading || loadingSession) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '2px' }}>
        LOADING SYSTEM...
      </span>
    </div>
  );

  // Not authenticated — hero / login
  if (!user) {
    return (
      <main className="no-scroll">
        {/* Header */}
        <header>
          <div className="nav-brand">
            <div className="logo-container">
              <img src="/img/logo.png" alt="22 FROGS" style={{ height: '36px', width: '36px' }} />
            </div>
            <span className="nav-brand-text">22FROG</span>
          </div>
        </header>

        <div className="container hero-container">
          <div className="hero">
            <div className="hero-content">
              <h1 className="hero-title">
                FROG<br />ROYALE
              </h1>
              <button
                onClick={() => signIn('discord')}
                className="btn-discord"
              >
                Connect Discord
              </button>
            </div>
            <div className="frogs-img-container">
              <img src="/img/frogs-gray-ensemble.png" alt="22 Frogs" className="frogs-img" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer>
          <span className="footer-text">powered by 22frogs</span>
        </footer>
      </main>
    );
  }

  // Already applied — show dashboard
  if (app) {
    return <Dashboard initialUser={user} initialApp={app} initialMissions={missions} />;
  }

  // Registration form
  const regMissions = missions.filter(m => m.location === 'registration');

  return (
    <div style={{ paddingTop: '70px', paddingBottom: '60px', minHeight: '100vh' }}>
      {/* Header */}
      <header>
        <div className="nav-brand">
          <div className="logo-container">
            <img src="/img/logo.png" alt="22 FROGS" style={{ height: '38px', width: '38px' }} />
          </div>
          <span className="nav-brand-text">22 Frogs / WL Registration</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', boxShadow: '0 0 8px var(--accent-green)' }}></span>
            Connected as {user.username}
          </span>
          <button onClick={() => signOut()} className="btn-logout">Sign Out</button>
        </div>
      </header>

      <div className="container">
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Whitelist Application
            </h1>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}>
              Complete all directives to submit your application for GTD Mint
            </p>
          </div>

          <div className="glass-card" style={{ marginTop: 0 }}>
            <form onSubmit={handleSubmit}>
              {/* Task Directives */}
              {regMissions.map((m, idx) => (
                <div key={m.id} className="directive-card">
                  <span className="step-indicator">Directive 0{idx + 1}</span>
                  <div className="task-row">
                    <div className="task-text">
                      <div className="task-dot"></div>
                      {m.title}
                    </div>
                    <a
                      href={m.link}
                      target="_blank"
                      className="btn-go"
                    >
                      Execute
                    </a>
                  </div>
                  {m.actionType === 'quote' && (
                    <div className="input-group" style={{ marginTop: '18px', marginBottom: 0 }}>
                      <label className="input-label">
                        Quoted Tweet URL <span style={{ color: 'var(--accent-red)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="quotedTweet"
                        placeholder="https://x.com/your-username/status/..."
                        required
                      />
                    </div>
                  )}
                  {m.actionType === 'comment' && (
                    <div className="input-group" style={{ marginTop: '18px', marginBottom: 0 }}>
                      <label className="input-label">
                        Comment Link <span style={{ color: 'var(--accent-red)' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="commentedTweet"
                        placeholder="https://x.com/your-username/status/..."
                        required
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Wallet */}
              <div className="directive-card">
                <span className="step-indicator final">Final Step</span>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>
                    Destination Wallet Address <span style={{ color: 'var(--accent-red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="wallet"
                    placeholder="0x..."
                    required
                  />
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    marginTop: '8px',
                    lineHeight: 1.5
                  }}>
                    This address will be registered for whitelist allocation. Ensure it is correct before submitting.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ marginTop: '8px' }}
              >
                {submitting ? 'Transmitting...' : 'Submit Application'}
              </button>

              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginTop: '14px',
                letterSpacing: '1px'
              }}>
                SECURE CHANNEL — FORM DATA IS ENCRYPTED IN TRANSIT
              </p>
            </form>
          </div>

          {/* How to get WL mini guide */}
          <div className="wl-guide" style={{ marginTop: '20px' }}>
            <div className="wl-guide-title">Alternative Paths to Whitelist</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  padding: '3px 8px',
                  border: '1px solid rgba(56,189,248,0.3)',
                  borderRadius: '4px',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>PATH B</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Discord Activity:</strong> Chat actively in the general Discord channel. Every 10 messages earns 5 XP. Reach 3,000 chat XP to earn the Royal Ribbit role.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--accent-violet)',
                  fontWeight: 700,
                  padding: '3px 8px',
                  border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '4px',
                  flexShrink: 0,
                  marginTop: '1px'
                }}>PATH C</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Manual Review:</strong> Once you submit this application, the team will review it manually. High-quality applicants may be approved regardless of XP level.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
