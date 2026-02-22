'use client';

import { useEffect, useState } from 'react';
import Dashboard from './dashboard/page';
import { useSession, signIn } from 'next-auth/react';

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
    } catch (err) {
      alert('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingSession) return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;

  if (!user) {
    return (
      <main className="no-scroll">
        <div className="container hero-container">
          <div className="hero">
            <img src="/img/frogs-gray-ensemble.png" alt="22 Frogs" className="frogs-img" />
            <div>
              <button onClick={() => signIn('discord')} className="btn-discord" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>LOGIN WITH DISCORD</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (app) {
    return <Dashboard initialUser={user} initialApp={app} initialMissions={missions} />;
  }

  const regMissions = missions.filter(m => m.location === 'registration');

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '5px' }}>Welcome, {user.username}</h1>
        <p style={{ color: '#666', fontWeight: 600 }}>Complete the tasks below to enter the whitelist</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-card" style={{ marginTop: '20px' }}>
          <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '5px' }}>Mission Onboarding</h2>
          <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginBottom: '30px', fontWeight: 600 }}>Complete all directives to unlock mint eligibility</p>

          <form onSubmit={handleSubmit}>
            {regMissions.map((m, idx) => (
              <div key={m.id} className="directive-card" style={{ marginBottom: '24px', padding: '24px', border: '2px solid #e5e7eb', borderRadius: '20px', background: '#fff' }}>
                <span className="step-indicator" style={{ display: 'inline-block', background: '#f3f4f6', color: '#374151', fontSize: '0.75rem', fontWeight: 800, padding: '6px 12px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', border: '2px solid #e5e7eb' }}>
                  Directive 0{idx + 1}
                </span>
                <div className="task-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', background: '#fafaf9', padding: '16px 20px', borderRadius: '16px', border: '2px solid #e5e7eb' }}>
                  <div className="task-text" style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#6b7280', fontSize: '1.5rem', lineHeight: 1 }}>•</span>
                    {m.title}
                  </div>
                  <a href={m.link} target="_blank" className="btn-go" style={{ background: '#000', color: '#fff', padding: '10px 24px', borderRadius: '100px', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0 }}>
                    INITIATE
                  </a>
                </div>
                {m.actionType === 'quote' && (
                  <div className="input-group" style={{ marginTop: '20px', marginBottom: 0 }}>
                    <label className="input-label">Your Quoted Tweet URL <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" name="quotedTweet" placeholder="https://x.com/your-username/status/..." required style={{ marginBottom: 0 }} />
                  </div>
                )}
                {m.actionType === 'comment' && (
                  <div className="input-group" style={{ marginTop: '20px', marginBottom: 0 }}>
                    <label className="input-label">Your Comment Link <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" name="commentedTweet" placeholder="https://x.com/your-username/status/..." required style={{ marginBottom: 0 }} />
                  </div>
                )}
              </div>
            ))}

            <div className="directive-card" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <span className="step-indicator" style={{ background: '#111', color: '#fff', borderColor: '#111' }}>Final Step</span>
              <div className="input-group" style={{ background: 'transparent', marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '1.1rem' }}>Destination Wallet Address <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="wallet" placeholder="0x..." required style={{ background: '#fff', border: '2px solid #cbd5e1' }} />
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '10px', fontWeight: 600 }}>This address will be submitted for whitelist allocation.</p>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting} style={{ fontSize: '1.1rem', padding: '18px', marginTop: '10px' }}>
              {submitting ? 'Submitting...' : 'Submit All Directives'}
            </button>
            <p style={{ fontSize: '0.75rem', color: '#999', textAlign: 'center', marginTop: '15px', fontWeight: 700 }}>SECURE TRANSMISSION CHANNEL | V2.0.1</p>
          </form>
        </div>
      </div>
    </div>
  );
}
