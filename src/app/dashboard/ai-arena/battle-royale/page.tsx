'use client';

import { useState, useEffect } from 'react';

const MOCK_PARTICIPANTS = [
    { name: 'Unit_0xAlpha', health: 100, int: 85, color: '#00ffa3' },
    { name: 'Agent_Shadow', health: 100, int: 72, color: '#ff0055' },
    { name: 'Cyber_Frog_v2', health: 100, int: 91, color: '#ffae00' },
    { name: 'Neural_Reaper', health: 100, int: 64, color: '#00e5ff' },
    { name: 'Synd_Bot_42', health: 100, int: 78, color: '#ffffff' },
    { name: 'Your_Agent', health: 100, int: 88, color: '#00ff00', isUser: true }
];

export default function AIBattleRoyale() {
    const [phase, setPhase] = useState<'waiting' | 'breach' | 'winner'>('waiting');
    const [participants, setParticipants] = useState(MOCK_PARTICIPANTS);
    const [winner, setWinner] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [breachProgress, setBreachProgress] = useState(0);

    const startBreach = () => {
        setPhase('breach');
        setLogs(['[SYSTEM] BREACH COMMENCED. ATTEMPTING TO CRACK CORE...']);
    };

    useEffect(() => {
        if (phase === 'breach') {
            const timer = setInterval(() => {
                setBreachProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        const sorted = [...participants].sort((a, b) => b.int - a.int);
                        setWinner(sorted[0]);
                        setPhase('winner');
                        return 100;
                    }

                    // Periodic battle logs
                    if (prev % 20 === 0) {
                        const randomAgent = participants[Math.floor(Math.random() * participants.length)];
                        setLogs(l => [`[BREACH] ${randomAgent.name} bypassed firewall layer ${prev / 10 + 1}.`, ...l].slice(0, 6));
                    }

                    return prev + 1;
                });
            }, 100);
            return () => clearInterval(timer);
        }
    }, [phase]);

    return (
        <div className="battle-royale-container min-h-screen bg-[#050505] text-white p-12">
            <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
                <div>
                    <span className="text-[#00ffa3] font-mono text-xs uppercase tracking-[0.4em] mb-2 block">High Stakes Arena</span>
                    <h1 className="text-5xl font-black tracking-tighter italic">THE <span className="text-[#00ffa3]">DEEP BREACH</span></h1>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-gray-600 uppercase">Pot Pool</span>
                    <div className="text-3xl font-black text-[#00ffa3]">750 XP</div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto grid lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    <div className="bg-[#080808] border border-white/5 rounded-[40px] p-12 h-[600px] relative overflow-hidden">
                        {phase === 'waiting' && (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="text-8xl mb-6">≡ƒöÆ</div>
                                <h2 className="text-4xl font-black mb-4 italic">VAULT DOOR SEALED</h2>
                                <p className="text-gray-500 max-w-md mb-10 text-lg uppercase tracking-widest leading-relaxed">
                                    6 Agents stand by the threshold. Crack the core to secure the pot.
                                </p>
                                <button
                                    onClick={startBreach}
                                    className="px-12 py-5 bg-[#00ffa3] text-black font-black rounded-2xl hover:scale-105 transition-all shadow-[0_0_50px_rgba(0,255,163,0.3)] animate-pulse"
                                >
                                    INITIATE BREACH (30 XP)
                                </button>
                            </div>
                        )}

                        {phase === 'breach' && (
                            <div className="h-full flex flex-col relative">
                                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                                    <div className="text-[200px] font-black">{breachProgress}%</div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
                                    {participants.map((p, i) => (
                                        <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-3xl text-center group">
                                            <div className="w-16 h-16 rounded-full bg-white/5 border-2 border-dashed mx-auto mb-4 flex items-center justify-center group-hover:animate-spin" style={{ borderColor: p.color }}>
                                                <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: p.color }}></div>
                                            </div>
                                            <div className="font-bold text-sm mb-2">{p.name}</div>
                                            <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-3">Intelligence: {p.int}</div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full transition-all duration-300" style={{ backgroundColor: p.color, width: `${100 - (breachProgress * (p.int / 100))}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-auto bg-black/50 border border-white/5 p-6 rounded-2xl font-mono text-[10px]">
                                    {logs.map((l, i) => (
                                        <div key={i} className={i === 0 ? 'text-[#00ffa3]' : 'text-gray-600'}>{l}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {phase === 'winner' && winner && (
                            <div className="h-full flex flex-col items-center justify-center text-center step-fade">
                                <div className="text-8xl mb-6">≡ƒÅå</div>
                                <h2 className="text-5xl font-black mb-2 italic" style={{ color: winner.color }}>{winner.name}</h2>
                                <p className="text-[#00ffa3] text-xl font-bold uppercase tracking-[0.2em] mb-10">CORE BREACHED. POT SECURED.</p>

                                <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] mb-12">
                                    <div className="text-sm text-gray-500 uppercase mb-2">Reward Deposited</div>
                                    <div className="text-6xl font-black text-white">+750 XP</div>
                                </div>

                                <button
                                    onClick={() => window.location.href = '/dashboard/ai-arena'}
                                    className="px-12 py-5 border border-white/20 text-white font-bold rounded-2xl hover:bg-white hover:text-black transition-all"
                                >
                                    RETURN TO COMMAND CENTER
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="bg-white/5 border border-white/5 p-8 rounded-[40px]">
                        <h3 className="font-black text-xs uppercase tracking-widest mb-6">Current Pot</h3>
                        <div className="text-4xl font-black text-[#00ffa3]">750 XP</div>
                        <div className="text-[10px] text-gray-500 mt-2 uppercase">Winner takes all</div>
                    </div>

                    <div className="bg-[#ff0055]/5 border border-[#ff0055]/20 p-8 rounded-[40px]">
                        <h3 className="font-black text-xs uppercase tracking-widest mb-4 text-[#ff0055]">Warning: High Risk</h3>
                        <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-tighter">
                            Entry requires 30 XP. Only one agent will successfully extract the core. Neural damage may occur.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-8 rounded-[40px]">
                        <h3 className="font-black text-xs uppercase tracking-widest mb-6">Online Agents</h3>
                        <div className="space-y-4">
                            {MOCK_PARTICIPANTS.map((p, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: p.color }}></div>
                                    <div className="text-xs font-bold text-gray-400">{p.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            <style jsx>{`
                .step-fade {
                    animation: fadeIn 0.8s cubic-bezier(0.23, 1, 0.32, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
