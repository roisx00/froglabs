'use client';

import { useState } from 'react';

const NEURAL_CORES = [
    { id: 'aggressive', name: 'Berserker', description: 'Prioritizes high-impact strikes and brute force.', color: '#ff0055' },
    { id: 'calculated', name: 'Strategist', description: 'Analyzes weaknesses and waits for the perfect moment.', color: '#00ffa3' },
    { id: 'chaos', name: 'Trickster', description: 'Uses unpredictable patterns to confuse opponents.', color: '#ffae00' }
];

export default function AILab() {
    const [step, setStep] = useState(0); // 0 = Claim, 1 = Select Core, 2 = Calibrate, 3 = Synthesis Complete, 4 = Training
    const [core, setCore] = useState(NEURAL_CORES[1]);
    const [stats, setStats] = useState({ processing: 10, resilience: 10, stealth: 10 });
    const [trainingLog, setTrainingLog] = useState<string[]>(['Neural Net initialized...', 'Waiting for directives...']);

    const updateStat = (stat: keyof typeof stats, delta: number) => {
        setStats(prev => ({ ...prev, [stat]: Math.max(1, prev[stat] + delta) }));
    };

    const addTrainingEntry = (msg: string) => {
        setTrainingLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
    };

    return (
        <div className="lab-container">
            {step === 0 && (
                <div className="step-fade text-center py-10">
                    <div className="relative mb-8 inline-block">
                        <div className="absolute inset-0 bg-[#00ffa3] blur-[100px] opacity-20 animate-pulse"></div>
                        <div className="w-64 h-64 border-2 border-dashed border-[#00ffa3]/30 rounded-full flex items-center justify-center relative">
                            <div className="text-6xl animate-bounce">≡ƒôª</div>
                        </div>
                    </div>
                    <h3 className="text-4xl font-black text-white italic">GEN-0 AGENT DETECTED</h3>
                    <p className="text-gray-500 mt-2 uppercase tracking-[0.3em] text-xs">Unclaimed biometric unit available</p>

                    <button
                        onClick={() => setStep(1)}
                        className="mt-12 px-16 py-5 bg-[#00ffa3] text-black font-black rounded-xl hover:scale-105 transition-all text-sm shadow-[0_0_40px_rgba(0,255,163,0.4)]"
                    >
                        CLAIM YOUR AGENT
                    </button>
                    <p className="mt-6 text-[10px] text-gray-600 uppercase">Limited Gen-0 units remaining: 4,921</p>
                </div>
            )}

            {step === 1 && (
                <div className="step-fade">
                    <h3 className="text-2xl font-black mb-2 text-white">SELECT NEURAL CORE</h3>
                    <p className="text-gray-500 mb-8 text-xs uppercase tracking-widest">Digital Personality Matrix</p>

                    <div className="grid gap-4">
                        {NEURAL_CORES.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setCore(c)}
                                className={`p-6 rounded-2xl border-2 text-left transition-all ${core.id === c.id ? 'bg-white/10' : 'bg-transparent opacity-50 border-white/10'}`}
                                style={{ borderColor: core.id === c.id ? c.color : 'transparent' }}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-black text-lg uppercase tracking-tighter" style={{ color: c.color }}>{c.name}</span>
                                    {core.id === c.id && <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white">ACTIVE</span>}
                                </div>
                                <p className="text-sm text-gray-400">{c.description}</p>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        className="w-full mt-8 py-4 bg-[#00ffa3] text-black font-black rounded-xl hover:shadow-[0_0_30px_rgba(0,255,163,0.3)] transition-all"
                    >
                        CONTINUE TO CALIBRATION
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="step-fade">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-white">CALIBRATION</h3>
                            <p className="text-gray-500 text-xs uppercase tracking-widest">Stat Allocation Unit</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {[
                            { id: 'processing', name: 'Processing Power', desc: 'Increases attack frequency & accuracy.' },
                            { id: 'resilience', name: 'Resilience', desc: 'Higher durability against neural damage.' },
                            { id: 'stealth', name: 'Stealth Systems', desc: 'Reduces chance of being countered.' }
                        ].map(s => (
                            <div key={s.id}>
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <div className="font-bold text-white text-sm">{s.name}</div>
                                        <div className="text-[10px] text-gray-500">{s.desc}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => updateStat(s.id as any, -1)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">-</button>
                                        <span className="w-8 text-center font-bold text-[#00ffa3]">{(stats as any)[s.id]}</span>
                                        <button onClick={() => updateStat(s.id as any, 1)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">+</button>
                                    </div>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#00ffa3] transition-all" style={{ width: `${((stats as any)[s.id] / 20) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-12">
                        <button onClick={() => setStep(1)} className="py-4 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-white/5">Back</button>
                        <button onClick={() => setStep(3)} className="py-4 bg-[#00ffa3] text-black font-black rounded-xl text-sm hover:shadow-[0_0_30px_rgba(0,255,163,0.3)]">SYNTHESIZE AGENT</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="step-fade text-center py-10">
                    <div className="relative mb-8 inline-block">
                        <div className="absolute inset-0 bg-[#00ffa3] blur-[60px] opacity-20 animate-pulse"></div>
                        <img src="/c:/Users/USER/.gemini/antigravity/brain/57ae4fda-0be9-4296-9998-d3cc368f9bfe/syndicate_agent_base_1772127156175.png" alt="Agent" className="w-64 h-64 object-contain relative z-10" />
                    </div>
                    <h3 className="text-4xl font-black text-white italic">SYNTHESIS COMPLETE</h3>
                    <p className="text-gray-500 mt-2 uppercase tracking-[0.3em] text-xs">Unit serial: SYND-9921-X</p>

                    <button
                        onClick={() => setStep(4)}
                        className="mt-12 px-12 py-4 bg-[#00ffa3] text-black font-black rounded-xl hover:scale-105 transition-all text-sm"
                    >
                        ENTER TRAINING DECK
                    </button>
                </div>
            )}

            {step === 4 && (
                <div className="step-fade">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-white">NEURAL TRAINING</h3>
                            <p className="text-gray-500 text-xs uppercase tracking-widest">Intelligence Augmentation</p>
                        </div>
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                            <span className="text-[10px] text-gray-600 uppercase block">Rank</span>
                            <span className="text-lg font-bold text-[#00ffa3]">INITIATE</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <h4 className="text-[10px] text-gray-500 uppercase font-black mb-4">Training Log</h4>
                            <div className="space-y-2 font-mono text-[9px]">
                                {trainingLog.map((log, i) => (
                                    <div key={i} className={i === 0 ? 'text-[#00ffa3]' : 'text-gray-600'}>{log}</div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
                            <div className="text-[10px] text-gray-500 uppercase mb-2">Neural Intensity</div>
                            <div className="text-4xl font-black text-white">84%</div>
                            <div className="w-full h-1 bg-white/5 rounded-full mt-4">
                                <div className="h-full bg-[#00ffa3] w-[84%] animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button onClick={() => addTrainingEntry('Simulating combat scenarios...')} className="w-full py-4 border border-white/10 rounded-xl text-xs font-bold uppercase hover:bg-[#00ffa3]/10 hover:border-[#00ffa3]/50 transition-all text-left px-6 flex justify-between items-center group">
                            <span>Scenario Drills</span>
                            <span className="text-gray-600 group-hover:text-[#00ffa3]">+5 INT</span>
                        </button>
                        <button onClick={() => addTrainingEntry('Recalibrating logic gates...')} className="w-full py-4 border border-white/10 rounded-xl text-xs font-bold uppercase hover:bg-[#00ffa3]/10 hover:border-[#00ffa3]/50 transition-all text-left px-6 flex justify-between items-center group">
                            <span>Logic Calibration</span>
                            <span className="text-gray-600 group-hover:text-[#00ffa3]">+3 INT</span>
                        </button>
                        <button onClick={() => addTrainingEntry('Analyzing market patterns...')} className="w-full py-4 border border-white/10 rounded-xl text-xs font-bold uppercase hover:bg-[#00ffa3]/10 hover:border-[#00ffa3]/50 transition-all text-left px-6 flex justify-between items-center group">
                            <span>Market Intel Sync</span>
                            <span className="text-gray-600 group-hover:text-[#00ffa3]">+8 INT</span>
                        </button>
                    </div>

                    <button
                        onClick={() => window.location.href = '/dashboard/ai-arena/battle-royale'}
                        className="w-full mt-10 py-5 bg-white text-black font-black rounded-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
                    >
                        <span>≡ƒÜÇ Enter Battle Royale (30 XP)</span>
                    </button>
                </div>
            )}

            <style jsx>{`
                .lab-container {
                    padding: 40px;
                    min-height: 500px;
                }
                .step-fade {
                    animation: fadeIn 0.4s cubic-bezier(0.23, 1, 0.32, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
