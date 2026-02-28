'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const NeuralArena = () => {
    const { data, mutate } = useSWR('/api/arena', fetcher, { refreshInterval: 10000 });
    const [status, setStatus] = useState<'idle' | 'loading' | 'queued' | 'battling' | 'finished'>('idle');
    const [currentBattle, setCurrentBattle] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const handleJoin = async () => {
        setStatus('loading');
        try {
            const res = await fetch('/api/arena', { method: 'POST' });
            const result = await res.json();

            if (result.success) {
                if (result.status === 'queued') {
                    setStatus('queued');
                    setLogs(['Awaiting neural connection...', 'Searching for opponent in the Bayou...']);
                } else if (result.status === 'battled') {
                    setCurrentBattle(result.battle);
                    playBattleSequence(result.battle);
                }
            } else {
                alert(result.reason || 'Failed to join arena');
                setStatus('idle');
            }
        } catch (err) {
            console.error("Arena join error:", err);
            setStatus('idle');
        }
    };

    const playBattleSequence = (battle: any) => {
        setStatus('battling');
        setLogs(['CONNECTION ESTABLISHED.', `OPPONENT DETECTED: ${battle.loserId === battle.winnerId ? 'UNKNOWN' : (battle.winnerName === 'YOU' ? battle.loserName : battle.winnerName)}`]);

        let i = 0;
        const interval = setInterval(() => {
            if (i < battle.log.length) {
                setLogs(prev => [...prev, battle.log[i]]);
                i++;
            } else {
                clearInterval(interval);
                setStatus('finished');
                mutate(); // Refresh stats
            }
        }, 1500);
    };

    return (
        <div className="arena-terminal">
            <div className="terminal-header">
                <span className="blink-dot"></span>
                <span className="terminal-title">NEURAL ARENA // PROTOCOL 02</span>
            </div>

            <div className="stats-strip">
                <div className="stat-node">
                    <span className="label">TOTAL BATTLES</span>
                    <span className="value">{data?.totalBattles || 0}</span>
                </div>
                <div className="stat-node">
                    <span className="label">ACTIVE AGENTS</span>
                    <span className="value">{data?.activeParticipants || 'SYST_SYNC'}</span>
                </div>
            </div>

            <div className="main-viewport">
                {status === 'idle' && (
                    <div className="idle-state">
                        <div className="warning-box">
                            <h4 className="warning-title">! WARNING</h4>
                            <p>ENTERING THE ARENA EXPOSES YOUR NEURAL CORE TO AGGRESSIVE DE-SYNCHRONIZATION.</p>
                        </div>
                        <button className="btn-enter" onClick={handleJoin}>
                            INITIATE NEURAL LINK
                        </button>
                    </div>
                )}

                {(status === 'queued' || status === 'loading' || status === 'battling' || status === 'finished') && (
                    <div className="battle-display">
                        <div className="log-deck">
                            {logs.map((log, i) => (
                                <div key={i} className="log-line">
                                    <span className="log-prefix">&gt;</span>
                                    <span className="log-text">{log}</span>
                                </div>
                            ))}
                            {status === 'battling' && <div className="log-cursor">_</div>}
                        </div>

                        {status === 'finished' && (
                            <button className="btn-reset" onClick={() => { setStatus('idle'); setLogs([]); }}>
                                EXIT TERMINAL
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="footer-metadata">
                <span>SECURE ENCRYPTION: AES-256</span>
                <span>BAYOU NET // VER 4.0.2</span>
            </div>

            <style jsx>{`
                .arena-terminal {
                    background: #0A0A0A;
                    border: 2px solid var(--text-primary);
                    border-radius: var(--radius-md);
                    padding: 24px;
                    margin-top: 20px;
                    box-shadow: 4px 4px 0px var(--text-primary);
                    color: #00FFA3;
                    font-family: 'Space Mono', monospace;
                }
                .terminal-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(0, 255, 163, 0.2);
                    margin-bottom: 20px;
                }
                .blink-dot {
                    width: 8px;
                    height: 8px;
                    background: #00FFA3;
                    border-radius: 50%;
                    animation: blink 1s infinite;
                }
                .terminal-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                }
                .stats-strip {
                    display: flex;
                    gap: 30px;
                    margin-bottom: 30px;
                }
                .stat-node {
                    display: flex;
                    flex-direction: column;
                }
                .stat-node .label {
                    font-size: 0.6rem;
                    color: rgba(0, 255, 163, 0.5);
                    letter-spacing: 1px;
                }
                .stat-node .value {
                    font-size: 1.2rem;
                    font-weight: 900;
                }
                .main-viewport {
                    min-height: 250px;
                    background: rgba(0, 255, 163, 0.03);
                    border: 1px solid rgba(0, 255, 163, 0.1);
                    border-radius: var(--radius-sm);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .warning-box {
                    border: 1px solid #FF3E3E;
                    padding: 15px;
                    background: rgba(255, 62, 62, 0.05);
                    margin-bottom: 25px;
                    text-align: center;
                }
                .warning-title {
                    color: #FF3E3E;
                    font-size: 0.8rem;
                    margin-bottom: 5px;
                }
                .warning-box p {
                    font-size: 0.65rem;
                    color: rgba(255, 62, 62, 0.8);
                }
                .btn-enter {
                    background: #00FFA3;
                    color: #000;
                    border: none;
                    padding: 15px;
                    font-weight: 900;
                    text-transform: uppercase;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 1px;
                }
                .btn-enter:hover {
                    box-shadow: 0 0 20px rgba(0, 255, 163, 0.4);
                    transform: scale(1.02);
                }
                .log-deck {
                    height: 180px;
                    overflow-y: auto;
                }
                .log-line {
                    font-size: 0.75rem;
                    margin-bottom: 8px;
                    display: flex;
                    gap: 10px;
                    animation: scanline 0.2s ease-out;
                }
                .log-prefix { opacity: 0.5; }
                .btn-reset {
                    margin-top: 20px;
                    background: transparent;
                    border: 1px solid #00FFA3;
                    color: #00FFA3;
                    padding: 8px 20px;
                    font-size: 0.7rem;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .btn-reset:hover {
                    background: rgba(0, 255, 163, 0.1);
                }
                .footer-metadata {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.55rem;
                    opacity: 0.3;
                }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                @keyframes scanline { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>
        </div>
    );
};

export default NeuralArena;
