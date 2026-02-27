'use client';

import { useState, useEffect } from 'react';

const POWERS = [
    { id: 'toxic_spray', name: 'Toxic Spray', type: 'Offense', xpCost: 50, effect: 'DoT Damage', icon: '🧪', desc: 'Corrupts enemy shielding over time.' },
    { id: 'mind_hack', name: 'Mind Hack', type: 'Utility', xpCost: 150, effect: 'Confusion', icon: '🧠', desc: '15% chance to force enemy to attack themselves.' },
    { id: 'shield_protocol', name: 'Shield Protocol', type: 'Defense', xpCost: 100, effect: 'Block', icon: '🛡️', desc: 'Deploy kinetic barrier absorbing 50 DMG.' },
    { id: 'chaos_mode', name: 'Chaos Mode', type: 'Offense', xpCost: 200, effect: 'Critical Strike', icon: '⚡', desc: 'Overclock processor for massive random spikes.' }
];

export default function ToxicBarracks({ user, onEnterLobby }: { user: any, onEnterLobby: () => void }) {
    const [agentSynthesized, setAgentSynthesized] = useState(false);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [xpBalance, setXpBalance] = useState((user?.chatXP || 0) + (user?.socialXP || 0));

    // In a real app, these would come from user's DB doc, but we mock local state for the prototype
    const [agentStats, setAgentStats] = useState({
        level: 0,
        name: 'Gen-Zero Agent',
        health: 100,
        damage: 10,
        speed: 1.0,
        powers: [] as string[]
    });

    const triggerSynthesis = () => {
        setIsSynthesizing(true);
        setTimeout(() => {
            setAgentSynthesized(true);
            setIsSynthesizing(false);
        }, 2500);
    };

    const buyPower = (powerId: string, cost: number) => {
        if (xpBalance >= cost && !agentStats.powers.includes(powerId)) {
            setXpBalance(prev => prev - cost);
            setAgentStats(prev => ({ ...prev, powers: [...prev.powers, powerId] }));
        }
    };

    if (!agentSynthesized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="mb-8">
                    <div className="text-4xl mb-4">🦇</div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2">NO AGENT DETECTED</h2>
                    <p className="font-mono text-gray-500 text-sm uppercase tracking-widest max-w-md mx-auto">
                        To enter the combat simulation, you must synthesize a Gen-Zero Agent.
                    </p>
                </div>

                <button
                    onClick={triggerSynthesis}
                    disabled={isSynthesizing}
                    className="relative group overflow-hidden bg-white/5 border border-white/10 px-8 py-4 rounded-xl"
                >
                    <div className="absolute inset-0 bg-[#00ffa3]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative font-mono font-bold text-sm tracking-widest text-[#00ffa3]">
                        {isSynthesizing ? '> SYNTHESIZING_DNA...' : 'INITIALIZE GEN-ZERO'}
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent Status Panel */}
            <div className="lg:col-span-1 glass-card border border-white/10 flex flex-col h-full bg-[#050505] p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ffa3]/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                    <div>
                        <div className="text-[10px] font-mono text-[#00ffa3] uppercase tracking-widest mb-1">Status: Active</div>
                        <h2 className="text-2xl font-black text-white italic tracking-tight uppercase">{agentStats.name}</h2>
                    </div>
                    <div className="bg-white/10 px-3 py-1 rounded font-mono text-xs text-white">
                        LVL 0{agentStats.level}
                    </div>
                </div>

                {/* Agent Avatar Placeholder */}
                <div className="flex-1 min-h-[200px] border border-white/5 rounded-xl bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 bg-[#00ffa3]/5 mix-blend-overlay"></div>
                    <div className="text-6xl animate-pulse">🤖</div>
                </div>

                {/* Base Stats */}
                <div className="space-y-3 font-mono text-xs uppercase tracking-widest text-gray-400">
                    <div className="flex justify-between items-center bg-white/5 px-4 py-2 rounded">
                        <span>Core Integrity (HP)</span>
                        <span className="text-white">{agentStats.health}/100</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-4 py-2 rounded">
                        <span>Base Output (DMG)</span>
                        <span className="text-white">{agentStats.damage}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-4 py-2 rounded">
                        <span>Processor (SPD)</span>
                        <span className="text-white">{agentStats.speed.toFixed(1)}x</span>
                    </div>
                </div>
            </div>

            {/* Marketplace & Upgrades Panel */}
            <div className="lg:col-span-2 glass-card border border-white/10 bg-[#050505] p-6 flex flex-col h-full">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter mb-1">SUPER POWERS</h3>
                        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.2em]">Acquire tactical advantages using XP</p>
                    </div>
                    <div className="font-mono text-xs font-bold px-4 py-2 border border-[#00ffa3]/30 rounded bg-[#00ffa3]/10 text-[#00ffa3]">
                        BALANCE: {xpBalance} XP
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {POWERS.map(power => {
                        const isOwned = agentStats.powers.includes(power.id);
                        const canAfford = xpBalance >= power.xpCost;

                        return (
                            <div key={power.id} className={`border p-4 rounded-xl flex flex-col transition-all ${isOwned ? 'border-[#00ffa3]/50 bg-[#00ffa3]/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{power.icon}</span>
                                        <span className="font-bold text-white text-sm">{power.name}</span>
                                    </div>
                                    <span className="font-mono text-[10px] uppercase text-gray-500">{power.type}</span>
                                </div>
                                <p className="text-xs text-gray-400 font-mono mb-4 flex-1">{power.desc}</p>

                                <button
                                    onClick={() => buyPower(power.id, power.xpCost)}
                                    disabled={isOwned || !canAfford}
                                    className={`w-full py-2 font-mono text-xs font-bold uppercase tracking-widest rounded transition-colors ${isOwned ? 'bg-[#00ffa3]/20 text-[#00ffa3] cursor-default' :
                                            canAfford ? 'bg-white text-black hover:bg-[#00ffa3]' :
                                                'bg-white/5 text-gray-600 cursor-not-allowed'
                                        }`}
                                >
                                    {isOwned ? 'EQUIPPED' : `ACQUIRE (${power.xpCost} XP)`}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 flex justify-end">
                    <button
                        onClick={onEnterLobby}
                        className="bg-[#00ffa3] text-black font-black italic uppercase tracking-widest px-8 py-4 rounded hover:bg-white transition-colors"
                    >
                        ENTER MATCHMAKING (-1 XP)
                    </button>
                </div>
            </div>
        </div>
    );
}
