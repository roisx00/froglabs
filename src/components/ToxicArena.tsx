'use client';

import { useState, useEffect, useRef } from 'react';
import { simulateBattle, Agent, BattleLog } from '@/lib/toxicBattleLogic';

// Fake leaderboard data for MVP opponents
const MOCK_OPPONENTS = [
    { name: 'NeuralHack', power: 'toxic_spray' },
    { name: 'Cipher.eth', power: 'shield_protocol' },
    { name: 'NullP0int', power: 'chaos_mode' },
    { name: 'VaultTech', power: 'mind_hack' },
    { name: 'Aegis_01', power: 'shield_protocol' },
    { name: 'GhostRun', power: 'chaos_mode' },
    { name: 'ZeroDay', power: 'toxic_spray' },
    { name: 'GlitchFrog', power: 'mind_hack' },
    { name: 'Terminal_X', power: 'chaos_mode' },
    { name: 'ByteRider', power: 'shield_protocol' },
    { name: 'RootAccess', power: 'toxic_spray' }
];

export default function ToxicArena({ user, onExit }: { user: any, onExit: () => void }) {
    const [phase, setPhase] = useState<'lobby' | 'combat' | 'results'>('lobby');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [displayedLogs, setDisplayedLogs] = useState<BattleLog[]>([]);
    const [battleWinner, setBattleWinner] = useState<Agent | null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Initialize 12-player lobby
    useEffect(() => {
        const playerAgent: Agent = {
            id: 'player_1',
            name: user?.username ? `${user.username} (Gen-Zero)` : 'You (Gen-Zero)',
            health: 100,
            maxHealth: 100,
            damage: 10,
            speed: 1.0,
            powers: ['toxic_spray'], // Mocking that user bought toxic spray
            isAlive: true,
            tier: 'Player'
        };

        const opponents: Agent[] = MOCK_OPPONENTS.map((opp, i) => ({
            id: `bot_${i}`,
            name: opp.name,
            health: 100,
            maxHealth: 100,
            damage: 8 + Math.floor(Math.random() * 5),
            speed: 1.0,
            powers: [opp.power],
            isAlive: true,
            tier: 'CPU'
        }));

        setAgents([playerAgent, ...opponents]);
    }, [user]);

    // Auto-scroll combat log
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayedLogs]);

    const startBattle = () => {
        setPhase('combat');
        const { winner, logs } = simulateBattle([...agents]);
        setBattleWinner(winner);

        // Feed logs slowly for visual effect
        let i = 0;
        const interval = setInterval(() => {
            if (i < logs.length) {
                setDisplayedLogs(prev => [...prev, logs[i]]);

                // Update live HP bars based on log content (rough visual mapping)
                const currentLog = logs[i];
                if (currentLog && (currentLog.type === 'attack' || currentLog.type === 'power' || currentLog.type === 'elimination')) {
                    // In a real sophisticated app, the logic would return tick-by-tick state
                    // Here we let the log playback drive the tension.
                }

                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => setPhase('results'), 2000);
            }
        }, 300); // 300ms per action
    };

    if (phase === 'lobby') {
        return (
            <div className="flex flex-col h-full bg-[#050505] border border-white/10 p-8 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00ffa3]/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="text-center mb-10 relative z-10">
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">ARENA MATCHMAKING</h2>
                    <p className="font-mono text-[#00ffa3] text-sm uppercase tracking-widest">12 Agents Connected. Awaiting override.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10 overflow-y-auto max-h-[50vh] pr-2 relative z-10">
                    {agents.map((agent, i) => (
                        <div key={agent.id} className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${agent.tier === 'Player' ? 'bg-[#00ffa3]/10 border-[#00ffa3]/50' : 'bg-white/5 border-white/10'}`}>
                            <div className="text-2xl mb-2">{agent.tier === 'Player' ? '🐸' : '🤖'}</div>
                            <div className={`font-mono font-bold text-xs truncate w-full ${agent.tier === 'Player' ? 'text-[#00ffa3]' : 'text-gray-300'}`}>
                                {agent.name}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto flex justify-center gap-4 relative z-10">
                    <button onClick={onExit} className="px-8 py-3 rounded font-mono text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white transition-colors">
                        ABORT
                    </button>
                    <button onClick={startBattle} className="px-10 py-3 rounded font-black text-sm italic uppercase tracking-widest bg-[#00ffa3] hover:bg-white text-black transition-colors shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                        INITIATE BATTLE SEQUENCE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#050505] border border-white/10 p-6 relative">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">COMBAT TERMINAL</h2>
                    <p className="text-[#00ffa3] font-mono text-[10px] uppercase tracking-widest animate-pulse">Live Feed Active...</p>
                </div>
                {phase === 'results' && (
                    <button onClick={onExit} className="px-4 py-2 border border-white/20 rounded font-mono text-xs hover:bg-white/10">Leave Arena</button>
                )}
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">

                {/* Visual Representation (Left) */}
                <div className="hidden md:flex flex-1 border border-white/10 bg-black rounded-lg relative overflow-hidden items-center justify-center">
                    {/* Highly abstract vector visuals representing battle chaos */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #00ffa3 0%, transparent 50%)' }}></div>

                    {phase === 'combat' ? (
                        <div className="text-center font-mono">
                            <div className="text-[#00ffa3] text-6xl mb-4 animate-ping">⚔️</div>
                            <div className="text-white text-sm tracking-widest uppercase">Executing Logic Sequence</div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="text-6xl mb-4">🏆</div>
                            <div className="text-white font-black italic text-2xl tracking-tighter uppercase mb-2">WINNER DECLARED</div>
                            <div className="text-[#00ffa3] font-mono font-bold text-lg">{battleWinner?.name}</div>
                            {battleWinner?.tier === 'Player' && (
                                <div className="mt-4 text-[#ffae00] font-mono text-sm font-bold bg-[#ffae00]/10 border border-[#ffae00]/30 px-4 py-2 rounded inline-block">
                                    +12 XP REWARD DEPOSITED
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Combat Log Terminal (Right) */}
                <div className="flex-1 border border-white/10 bg-[#0a0a0a] rounded-lg p-4 font-mono text-xs overflow-y-auto relative custom-scrollbar flex flex-col">
                    <div className="sticky top-0 bg-[#0a0a0a] pb-2 mb-2 border-b border-white/5 text-gray-500 flex justify-between">
                        <span>// TOXIC.AGENTS.SYS</span>
                        <span>[READ MODE]</span>
                    </div>

                    <div className="flex-1 space-y-2">
                        {displayedLogs.map((log, index) => {
                            if (!log) return null;
                            let colorClass = 'text-gray-400';
                            if (log.type === 'power') colorClass = 'text-[#00ffa3] font-bold';
                            if (log.type === 'elimination') colorClass = 'text-red-500 font-bold';
                            if (log.type === 'system') colorClass = 'text-[#ffae00]';

                            return (
                                <div key={index} className={`flex gap-3 leading-relaxed ${colorClass}`}>
                                    <span className="opacity-50 shrink-0">{log.timestamp}</span>
                                    <span>{log.message}</span>
                                </div>
                            );
                        })}
                        <div ref={logsEndRef} />
                    </div>
                </div>

            </div>
        </div>
    );
}
