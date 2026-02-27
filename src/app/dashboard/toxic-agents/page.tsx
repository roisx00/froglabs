'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import ToxicBarracks from '@/components/ToxicBarracks';
import ToxicArena from '@/components/ToxicArena';
import ConsigliereAgent from '@/components/ConsigliereAgent';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ToxicAgentsPage() {
    const { data: session } = useSession();
    const [view, setView] = useState<'barracks' | 'arena'>('barracks');

    // Fetch user data for XP balances
    const { data: user } = useSWR(session ? '/api/user' : null, fetcher);
    const { data: appData } = useSWR(session ? '/api/application' : null, fetcher);

    return (
        <div style={{ paddingBottom: '60px' }}>
            <div className="container" style={{ marginTop: '80px' }}>
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '4px', fontStyle: 'italic', textTransform: 'uppercase' }}>
                        Toxic Agents Battle
                    </h1>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Train. Upgrade. Dominate.
                    </p>
                </div>

                <div style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}>
                    {view === 'barracks' ? (
                        <ToxicBarracks user={user} onEnterLobby={() => setView('arena')} />
                    ) : (
                        <ToxicArena user={user} onExit={() => setView('barracks')} />
                    )}
                </div>
            </div>
            {appData && <ConsigliereAgent app={appData} />}
        </div>
    );
}
