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
              <div key={m.id} style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                <span className="step-indicator">Directive 0{idx + 1}</span>
                <div className="task-row">
                  <div className="task-text">• {m.title}</div>
                  <a href={m.link} target="_blank" className="btn-go">INITIATE</a>
                </div>
                {m.actionType === 'quote' && (
                  <div className="input-group" style={{ marginTop: '15px', marginBottom: 0 }}>
                    <label className="input-label">Your Quoted Tweet URL <span style={{ color: 'red' }}>*</span></label>
                    <input type="text" name="quotedTweet" placeholder="https://x.com/your-username/status/..." required style={{ marginBottom: 0 }} />
                  </div>
                )}
                {m.actionType === 'comment' && (
                  <div className="input-group" style={{ marginTop: '15px', marginBottom: 0 }}>
                    <label className="input-label">Your Comment Link <span style={{ color: 'red' }}>*</span></label>
                    <input type="text" name="commentedTweet" placeholder="https://x.com/your-username/status/..." required style={{ marginBottom: 0 }} />
                  </div>
                )}
              </div>
            ))}

            <div className="input-group">
              <span className="step-indicator">Payment Gateway</span>
              <label className="input-label">0x Wallet Address <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="wallet" placeholder="0x..." required />
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
