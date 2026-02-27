'use client';

import AILab from '@/components/AILab';

export default function AIArenaPage() {
    return (
        <div className="min-h-screen bg-[#020202] text-white selection:bg-[#00ffa3] selection:text-black font-sans">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <header className="flex justify-between items-center mb-16 border-b border-white/5 pb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#00ffa3] animate-ping"></div>
                            <span className="text-[#00ffa3] font-mono text-xs tracking-widest uppercase">SYNDICATE NEURAL NET ACTIVATED</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter uppercase italic italic">
                            AI <span className="text-[#00ffa3]">ARENA</span>
                        </h1>
                        <p className="text-gray-500 mt-4 max-w-md text-lg leading-relaxed">
                            Welcome to the Bio-Digital frontier. Synthesize your agent, train its neural core, and dominate the digital underworld.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-right">
                            <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Global Ranking</div>
                            <div className="text-3xl font-black">#--</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-right">
                            <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">XP Earned</div>
                            <div className="text-3xl font-black text-[#00ffa3]">0</div>
                        </div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2">
                        <div className="relative">
                            {/* Visual Glow */}
                            <div className="absolute -inset-4 bg-[#00ffa3] rounded-[40px] blur-[80px] opacity-[0.03]"></div>

                            <div className="relative bg-[#080808] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
                                <div className="bg-white/5 border-b border-white/5 px-8 py-4 flex justify-between items-center">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">SYNTHESIS_UNIT_01</span>
                                </div>

                                <AILab />
                            </div>
                        </div>

                        <div className="mt-12 grid md:grid-cols-2 gap-6">
                            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] hover:bg-white/10 transition-all cursor-pointer group">
                                <h3 className="font-bold text-xl mb-2 flex items-center gap-3">
                                    THE MARKETPLACE
                                    <span className="text-[10px] bg-[#00ffa3] text-black px-2 py-0.5 rounded tracking-widest font-black uppercase">SOON</span>
                                </h3>
                                <p className="text-sm text-gray-500">List your battle-hardened agents for ETH or trade for legendary cores.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] hover:bg-white/10 transition-all cursor-pointer group">
                                <h3 className="font-bold text-xl mb-2 flex items-center gap-3">
                                    EVOLUTION LAB
                                    <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded tracking-widest font-black uppercase">SOON</span>
                                </h3>
                                <p className="text-sm text-gray-500">Achieve Level 50 to unlock biological mutations and legendary augments.</p>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-8">
                        <div className="bg-[#00ffa3]/5 border border-[#00ffa3]/20 p-8 rounded-[32px]">
                            <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-1 h-4 bg-[#00ffa3]"></span>
                                Active Directives
                            </h3>
                            <ul className="space-y-6">
                                {[
                                    { t: 'Synthesis', d: 'Choose your neural personality and calibrate stats.' },
                                    { t: 'Battle', d: 'Enter the arena and face other user-created AI agents.' },
                                    { t: 'Evolve', d: 'Earn XP to level up and dominate the rankings.' }
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-4">
                                        <div className="text-[#00ffa3] font-black italic text-xl">0{i + 1}</div>
                                        <div>
                                            <div className="font-bold text-sm text-white">{step.t}</div>
                                            <div className="text-xs text-gray-500 mt-1">{step.d}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-8 rounded-[32px]">
                            <h3 className="font-black text-sm uppercase tracking-widest mb-6">Recent Battles</h3>
                            <div className="space-y-4">
                                {[
                                    { w: 'Unit_0x11', l: 'Agent_Red', r: '+120 XP' },
                                    { w: 'Cyber_Frog', l: 'unit_X', r: '+150 XP' },
                                    { w: 'Consigliere_Jr', l: 'Bot_99', r: '+110 XP' }
                                ].map((b, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#00ffa3] font-bold">{b.w}</span>
                                            <span className="text-gray-700 font-black">VS</span>
                                            <span className="text-gray-500">{b.l}</span>
                                        </div>
                                        <div className="font-black text-[#00ffa3]">{b.r}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
