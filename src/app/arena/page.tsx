'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ArenaPage() {
    // --- Data Fetching ---
    const { data: arenaGlobalData, mutate: mutateArena } = useSWR('/api/arena', fetcher, { refreshInterval: 60000 });
    const { data: liveData } = useSWR('/api/arena/live', fetcher, { refreshInterval: 3000 }); // Fast refresh for global feed
    const { data: userData, mutate: mutateUser } = useSWR('/api/user', fetcher);
    const { data: appData, mutate: mutateApp } = useSWR('/api/application', fetcher);

    // --- Real-Time Presence (Heartbeat) ---
    useEffect(() => {
        if (!userData) return;

        // Ping immediately on mount
        fetch('/api/arena/ping', { method: 'POST' }).catch(() => { });

        // Ping every 15 seconds
        const heartbeat = setInterval(() => {
            fetch('/api/arena/ping', { method: 'POST' }).catch(() => { });
        }, 15000);

        return () => clearInterval(heartbeat);
    }, [userData]);
    // --- Training State ---
    const [isTraining, setIsTraining] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
    const [trainingLog, setTrainingLog] = useState<string[]>([]);

    // --- Battle State ---
    const [battleStatus, setBattleStatus] = useState<'idle' | 'loading' | 'queued' | 'battling' | 'finished'>('idle');
    const [currentBattle, setCurrentBattle] = useState<any>(null);
    const [battleLogs, setBattleLogs] = useState<string[]>([]);

    const trainingLevel = appData?.trainingLevel || 0;
    const processingPower = appData?.processingPower || 0;
    const stealth = appData?.stealth || 0;
    const resilience = appData?.resilience || 0;

    // --- Effect: Handle Cooldown Timer ---
    useEffect(() => {
        if (!appData) return;
        const now = Date.now();
        const lastTrainingTime = appData.lastTrainingTime || 0;
        const TRAINING_COOLDOWN_MS = 60 * 60 * 1000;

        if (now - lastTrainingTime < TRAINING_COOLDOWN_MS) {
            setCooldownRemaining(TRAINING_COOLDOWN_MS - (now - lastTrainingTime));
        } else {
            setCooldownRemaining(null);
        }

        const interval = setInterval(() => {
            const currentNow = Date.now();
            if (currentNow - lastTrainingTime < TRAINING_COOLDOWN_MS) {
                setCooldownRemaining(TRAINING_COOLDOWN_MS - (currentNow - lastTrainingTime));
            } else {
                setCooldownRemaining(null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [appData]);

    const formatCooldown = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    };

    // --- Handlers ---
    const handleTrainAgent = async () => {
        setIsTraining(true);
        setTrainingLog(['INITIATING NEURAL PATHWAY OPTIMIZATION...']);

        // Simulate training sequence
        setTimeout(() => setTrainingLog(prev => [...prev, 'CALIBRATING PROCESSING THREADS...']), 1000);
        setTimeout(() => setTrainingLog(prev => [...prev, 'INJECTING SYNAPTIC STIMULANT...']), 2000);

        setTimeout(async () => {
            try {
                const res = await fetch('/api/arena/train', { method: 'POST' });
                const result = await res.json();

                if (result.success) {
                    setTrainingLog(prev => [...prev, `TRAINING COMPLETE. NEW LEVEL: ${result.newLevel}`]);
                    mutateApp(); // refresh user data
                } else {
                    setTrainingLog(prev => [...prev, `ERROR: ${result.reason}`]);
                }
            } catch (err) {
                setTrainingLog(prev => [...prev, 'FATAL SYSTEM ERROR.']);
            }
            setTimeout(() => {
                setIsTraining(false);
                setTrainingLog([]);
            }, 3000);
        }, 3000);
    };

    const handleJoinBattle = async () => {
        setBattleStatus('loading');
        try {
            const res = await fetch('/api/arena', { method: 'POST' });
            const result = await res.json();

            if (result.success) {
                if (result.status === 'queued') {
                    setBattleStatus('queued');
                    setBattleLogs(['Awaiting neural connection...', 'Searching for opponent in the Bayou queue...']);
                } else if (result.status === 'battled') {
                    setCurrentBattle(result.battle);
                    playBattleSequence(result.battle);
                }
            } else {
                alert(result.reason || 'Failed to join arena');
                setBattleStatus('idle');
            }
        } catch (err) {
            console.error("Arena join error:", err);
            setBattleStatus('idle');
        }
    };

    const playBattleSequence = (battle: any) => {
        setBattleStatus('battling');
        setBattleLogs(['CONNECTION ESTABLISHED.', `OPPONENT DETECTED.`]);

        let i = 0;
        const interval = setInterval(() => {
            if (i < battle.log.length) {
                setBattleLogs(prev => [...prev, battle.log[i]]);
                i++;
            } else {
                clearInterval(interval);
                setBattleStatus('finished');
                mutateArena();
                mutateApp();
            }
        }, 1500);
    };

    if (!userData && !appData) {
        return (
            <div className="arena-loading">
                <span>SYNCING WITH BAYOU NET...</span>
                <style jsx>{`
                     .arena-loading {
                         display: flex; height: 100vh; width: 100vw;
                         background: #000; color: #00FFCC; justify-content: center; align-items: center;
                         font-family: 'Space Mono', monospace; letter-spacing: 2px;
                     }
                 `}</style>
            </div>
        )
    }

    return (
        <div className="arena-layout">
            <header className="arena-nav">
                <Link href="/dashboard" className="back-btn">← TERMINATE LINK & RETURN</Link>
                <div className="arena-brand">NEURAL ARENA // PROTOCOL 02</div>
                <div className="server-status">
                    <span className="blink-dot"></span> SECURE Connection
                </div>
            </header>

            <div className="arena-grid">
                {/* LEFT: Training Facility */}
                <div className="panel training-panel">
                    <div className="panel-header">
                        <h3>AGENT TRAINING FACILITY</h3>
                    </div>

                    <div className="agent-display">
                        <div className="agent-avatar"></div>
                        <div className="agent-info">
                            <div className="agent-name">{userData?.username || 'GUEST_AGENT'}</div>
                            <div className="agent-level">TRAINING LEVEL: <span className="highlight-text">{trainingLevel}</span></div>
                        </div>
                    </div>

                    <div className="agent-stats">
                        <div className="stat-row">
                            <span>Combat Power (Base)</span>
                            <span>{Math.floor((processingPower * 1.2) + (stealth * 1.0) + (resilience * 0.8))}</span>
                        </div>
                        <div className="stat-row">
                            <span>Processing</span>
                            <span>{processingPower || 0}</span>
                        </div>
                        <div className="stat-row">
                            <span>Stealth</span>
                            <span>{stealth || 0}</span>
                        </div>
                        <div className="stat-row">
                            <span>Resilience</span>
                            <span>{resilience || 0}</span>
                        </div>
                    </div>

                    <div className="training-action">
                        {isTraining ? (
                            <div className="training-terminal">
                                {trainingLog.map((log, i) => <div key={i}>&gt; {log}</div>)}
                                <div className="blink-cursor">_</div>
                            </div>
                        ) : cooldownRemaining !== null ? (
                            <button className="btn-train disabled" disabled>
                                SYSTEM COOLING ({formatCooldown(cooldownRemaining)})
                            </button>
                        ) : (
                            <button className="btn-train active" onClick={handleTrainAgent}>
                                INITIATE TRAINING SEQUENCE
                            </button>
                        )}
                        <p className="training-desc">Training significantly increases your Neural Combat Score. Requires 1 hour to cool down.</p>
                    </div>
                </div>

                {/* RIGHT: Battle Terminal & Live Feed */}
                <div className="panel battle-panel">
                    <div className="panel-header">
                        <h3>GLOBAL BATTLE FEED</h3>
                        <div className="arena-stats">
                            <span>ONLINE AGENTS: {liveData?.onlineAgents?.length || 0}</span>
                            <span>TOTAL CLASHES: {arenaGlobalData?.totalBattles || 0}</span>
                        </div>
                    </div>

                    {/* Live Agents Marquee */}
                    <div className="online-roster">
                        <div className="roster-label">ACTIVE IN BAYOU:</div>
                        <div className="roster-scroll">
                            <div className="roster-track">
                                {liveData?.onlineAgents?.map((agent: any) => (
                                    <span key={agent.id} className="online-agent">[{agent.name} Lv.{agent.level}]</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="battle-viewport">
                        {battleStatus === 'idle' && (
                            <div className="global-feed-container">
                                <div className="warning-box">
                                    <h4 className="warning-title">! LIVE FEED ACTIVE !</h4>
                                    <p>MATCHMAKING WILL POUND YOUR NEURAL CORE AGAINST RANDOM OPPONENTS IN THE BAYOU QUEUE.</p>
                                </div>
                                <button className="btn-enter" onClick={handleJoinBattle} style={{ marginBottom: '20px' }}>
                                    ENTER MATCHMAKING QUEUE
                                </button>

                                <div className="global-logs">
                                    <div className="log-header">GLOBAL SYNAPTIC CLASHES</div>
                                    <div className="log-deck global-deck">
                                        {liveData?.globalBattles?.map((b: any) => (
                                            <div key={b.id} className="global-log-entry">
                                                <span className="global-time">
                                                    {new Date(b.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </span>
                                                <span className="global-winner">{b.winnerName}</span>
                                                <span className="global-vs">defeated</span>
                                                <span className="global-loser">{b.loserName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(battleStatus === 'queued' || battleStatus === 'loading' || battleStatus === 'battling' || battleStatus === 'finished') && (
                            <div className="battle-display">
                                <div className="log-deck">
                                    {battleLogs.map((log, i) => (
                                        <div key={i} className="log-line">
                                            <span className="log-prefix">&gt;</span>
                                            <span className="log-text">{log}</span>
                                        </div>
                                    ))}
                                    {battleStatus === 'battling' && <div className="log-cursor">_</div>}
                                </div>

                                {battleStatus === 'finished' && (
                                    <button className="btn-reset" onClick={() => { setBattleStatus('idle'); setBattleLogs([]); }}>
                                        RESET TERMINAL
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .arena-layout {
                    min-height: 100vh;
                    background-color: #050505;
                    background-image: 
                        linear-gradient(rgba(0, 255, 204, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 204, 0.03) 1px, transparent 1px);
                    background-size: 30px 30px;
                    color: #fff;
                    font-family: var(--font-sans);
                }
                .arena-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 40px;
                    background: rgba(0, 0, 0, 0.8);
                    border-bottom: 1px solid rgba(0, 255, 204, 0.2);
                    backdrop-filter: blur(10px);
                }
                .back-btn {
                    color: rgba(255, 255, 255, 0.5);
                    text-decoration: none;
                    font-family: var(--font-mono);
                    font-size: 0.8rem;
                    letter-spacing: 1px;
                    transition: color 0.2s;
                }
                .back-btn:hover { color: #fff; }
                .arena-brand {
                    font-family: var(--font-mono);
                    color: var(--accent-cyan);
                    font-weight: 900;
                    letter-spacing: 2px;
                    text-shadow: 0 0 10px rgba(0, 255, 204, 0.4);
                }
                .server-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: var(--font-mono);
                    font-size: 0.7rem;
                    color: #00FF66;
                }
                .blink-dot {
                    width: 8px; height: 8px;
                    background: #00FF66;
                    border-radius: 50%;
                    animation: blink 2s infinite;
                }
                .arena-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 30px;
                    padding: 40px;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                @media (max-width: 1024px) {
                    .arena-grid { grid-template-columns: 1fr; }
                }

                /* Panels */
                .panel {
                    background: rgba(10, 10, 10, 0.9);
                    border: 1px solid rgba(0, 255, 204, 0.15);
                    border-radius: 8px;
                    padding: 30px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
                    position: relative;
                    overflow: hidden;
                }
                .panel::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 4px;
                    background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
                    opacity: 0.5;
                }
                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                .panel-header h3 {
                    margin: 0;
                    font-family: var(--font-mono);
                    font-size: 1.1rem;
                    color: #fff;
                    letter-spacing: 2px;
                }
                
                /* Training Facility */
                .agent-display {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: rgba(255,255,255,0.02);
                    border: 1px dashed rgba(255,255,255,0.1);
                    border-radius: 8px;
                }
                .agent-avatar {
                    width: 60px; height: 60px;
                    background: var(--accent-cyan);
                    border-radius: 50%;
                    box-shadow: 0 0 15px var(--accent-cyan);
                }
                .agent-name {
                    font-size: 1.2rem;
                    font-weight: 900;
                    margin-bottom: 4px;
                }
                .agent-level {
                    font-family: var(--font-mono);
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.5);
                }
                .highlight-text {
                    color: var(--accent-cyan);
                    font-weight: bold;
                    font-size: 1rem;
                }
                .agent-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 40px;
                }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    font-family: var(--font-mono);
                    font-size: 0.85rem;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .stat-row span:last-child {
                    color: var(--accent-cyan);
                    font-weight: bold;
                }

                .training-action {
                    margin-top: auto;
                }
                .btn-train {
                    width: 100%;
                    padding: 18px;
                    font-family: var(--font-mono);
                    font-weight: 900;
                    font-size: 0.9rem;
                    letter-spacing: 1px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .btn-train.active {
                    background: var(--accent-cyan);
                    color: #000;
                    box-shadow: 0 0 15px rgba(0, 255, 204, 0.3);
                }
                .btn-train.active:hover {
                    box-shadow: 0 0 25px rgba(0, 255, 204, 0.6);
                    transform: translateY(-2px);
                }
                .btn-train.disabled {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.3);
                    cursor: not-allowed;
                }
                .training-desc {
                    margin-top: 12px;
                    font-family: var(--font-mono);
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.4);
                    text-align: center;
                    line-height: 1.4;
                }
                .training-terminal {
                    background: #000;
                    padding: 15px;
                    min-height: 100px;
                    border-left: 3px solid var(--accent-cyan);
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    color: var(--accent-cyan);
                }

                /* Live Roster & Global Feed */
                .online-roster {
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(0, 255, 204, 0.05);
                    border-radius: 4px;
                    border: 1px solid rgba(0, 255, 204, 0.2);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    overflow: hidden;
                }
                .roster-label {
                    font-family: var(--font-mono);
                    font-size: 0.7rem;
                    color: var(--accent-cyan);
                    font-weight: bold;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .roster-scroll {
                    flex-grow: 1;
                    overflow: hidden;
                    position: relative;
                }
                .roster-track {
                    display: flex;
                    gap: 20px;
                    white-space: nowrap;
                    animation: marquee 20s linear infinite;
                }
                .online-agent {
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    color: #fff;
                }
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }

                .global-feed-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .global-logs {
                    flex-grow: 1;
                    border-top: 1px dashed rgba(255, 255, 255, 0.2);
                    padding-top: 15px;
                    margin-top: 15px;
                }
                .log-header {
                    font-family: var(--font-mono);
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 10px;
                    letter-spacing: 1px;
                }
                .global-deck {
                    height: 200px;
                }
                .global-log-entry {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: var(--font-mono);
                    font-size: 0.75rem;
                    margin-bottom: 8px;
                    padding: 6px;
                    background: rgba(255, 255, 255, 0.02);
                    border-left: 2px solid var(--accent-cyan);
                }
                .global-time { color: rgba(255, 255, 255, 0.4); font-size: 0.65rem; width: 60px; }
                .global-winner { color: #00FF66; font-weight: bold; }
                .global-vs { color: rgba(255, 255, 255, 0.5); font-size: 0.65rem; }
                .global-loser { color: #FF3E3E; }

                /* Battle Terminal */
                .arena-stats {
                    display: flex;
                    gap: 20px;
                    font-family: var(--font-mono);
                    font-size: 0.7rem;
                    color: rgba(255, 255, 255, 0.5);
                }
                .battle-viewport {
                    flex-grow: 1;
                    background: #000;
                    border: 1px solid rgba(0, 255, 204, 0.2);
                    border-radius: 6px;
                    padding: 30px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    min-height: 400px;
                }
                .idle-state {
                    max-width: 400px;
                    margin: 0 auto;
                    text-align: center;
                }
                .warning-box {
                    border: 1px solid #FF3E3E;
                    padding: 20px;
                    background: rgba(255, 62, 62, 0.05);
                    margin-bottom: 30px;
                }
                .warning-title {
                    color: #FF3E3E;
                    font-size: 1rem;
                    margin-bottom: 10px;
                    font-family: var(--font-mono);
                }
                .warning-box p {
                    font-size: 0.75rem;
                    color: rgba(255, 62, 62, 0.8);
                    line-height: 1.5;
                    font-family: var(--font-mono);
                }
                .btn-enter {
                    background: transparent;
                    color: #FF3E3E;
                    border: 2px solid #FF3E3E;
                    padding: 20px 30px;
                    font-family: var(--font-mono);
                    font-weight: 900;
                    font-size: 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 2px;
                    width: 100%;
                }
                .btn-enter:hover {
                    background: rgba(255, 62, 62, 0.1);
                    box-shadow: 0 0 20px rgba(255, 62, 62, 0.3);
                }
                .log-deck {
                    height: 300px;
                    overflow-y: auto;
                    font-family: var(--font-mono);
                }
                .log-line {
                    font-size: 0.85rem;
                    margin-bottom: 12px;
                    display: flex;
                    gap: 10px;
                    color: var(--accent-cyan);
                    animation: scanline 0.2s ease-out;
                }
                .log-prefix { opacity: 0.5; }
                .btn-reset {
                    margin-top: 30px;
                    background: transparent;
                    border: 1px solid var(--accent-cyan);
                    color: var(--accent-cyan);
                    padding: 12px 24px;
                    font-family: var(--font-mono);
                    font-size: 0.8rem;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .btn-reset:hover {
                    background: rgba(0, 255, 204, 0.1);
                }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                @keyframes scanline { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>
        </div>
    );
}
