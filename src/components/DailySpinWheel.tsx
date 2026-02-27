'use client';

import { useState, useEffect } from 'react';

const REWARDS = [
    { label: '5 XP', xp: 5, color: '#00ffa3', prob: 25 },
    { label: '10 XP', xp: 10, color: '#00ffa3', prob: 25 },
    { label: '15 XP', xp: 15, color: '#00ffa3', prob: 20 },
    { label: '20 XP', xp: 20, color: '#ffae00', prob: 15 },
    { label: '30 XP', xp: 30, color: '#ffae00', prob: 10 },
    { label: '50 XP', xp: 50, color: '#ffae00', prob: 4 },
    { label: '100 XP', xp: 100, color: '#ff4444', prob: 1 },
];

export default function DailySpinWheel({ onReward }: { onReward?: (xp: number) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [reward, setReward] = useState<{ xp: number, label: string } | null>(null);
    const [canSpin, setCanSpin] = useState(true); // Assuming they can spin once per demo

    // Auto popup
    useEffect(() => {
        const timer = setTimeout(() => setIsOpen(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    const spin = () => {
        if (!canSpin || isSpinning) return;
        setIsSpinning(true);
        setReward(null);

        // Weighted random selection
        const rand = Math.random() * 100;
        let cumulativeProb = 0;
        let selectedPrizeIndex = 0;

        for (let i = 0; i < REWARDS.length; i++) {
            cumulativeProb += REWARDS[i].prob;
            if (rand <= cumulativeProb) {
                selectedPrizeIndex = i;
                break;
            }
        }

        const sliceAngle = 360 / REWARDS.length;
        const targetAngle = 360 * 5 + (selectedPrizeIndex * sliceAngle) + (sliceAngle / 2); // 5 full spins + offset

        setRotation(-targetAngle); // Negative to spin clockwise toward the top pointer

        setTimeout(() => {
            setIsSpinning(false);
            setReward({ xp: REWARDS[selectedPrizeIndex].xp, label: REWARDS[selectedPrizeIndex].label });
            setCanSpin(false);
            if (onReward) onReward(REWARDS[selectedPrizeIndex].xp);
        }, 5000); // 5s spin duration
    };

    return (
        <>
            {/* FLOATING TRIGGER BUTTON */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-24 lg:bottom-10 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-black to-[#050605] border-2 border-[#00ffa3]/50 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,163,0.3)] hover:scale-110 transition-transform ${canSpin ? 'animate-bounce' : 'opacity-50'}`}
            >
                <span className="text-3xl">🎲</span>
                {canSpin && <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-black"></span>}
            </button>

            {/* MODAL OVERLAY */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="glass-card bg-[#050605] border border-white/20 p-8 rounded-2xl max-w-md w-full relative overflow-hidden shadow-[0_0_100px_rgba(0,255,163,0.1)] text-center">

                        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

                        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white mb-2">DAILY EXTRACTION</h2>
                        <p className="font-mono text-[9px] text-[#00ffa3] uppercase tracking-widest mb-8">Secure your daily XP rations.</p>

                        {/* WHEEL CONTAINER */}
                        <div className="relative w-64 h-64 mx-auto mb-8">
                            {/* Pointer */}
                            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-transparent border-t-[#00ffa3] z-20 drop-shadow-[0_0_10px_rgba(0,255,163,0.8)]"></div>

                            {/* The Wheel */}
                            <div
                                className="w-full h-full rounded-full border-4 border-[#00ffa3]/30 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black"
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    transition: isSpinning ? 'transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                                }}
                            >
                                {REWARDS.map((prize, i) => {
                                    const rotate = (i * 360) / REWARDS.length;
                                    return (
                                        <div
                                            key={i}
                                            className="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom flex justify-center -translate-x-1/2"
                                            style={{ transform: `rotate(${rotate}deg)` }}
                                        >
                                            <div
                                                className="w-0 h-0 border-l-[30px] border-r-[30px] border-t-[120px] border-transparent origin-bottom"
                                                style={{ borderTopColor: i % 2 === 0 ? 'rgba(0,255,163,0.1)' : 'rgba(255,255,255,0.05)' }}
                                            ></div>
                                            <span
                                                className="absolute top-2 w-[80px] text-center left-1/2 -translate-x-1/2 font-mono font-bold text-xs"
                                                style={{ color: prize.color, textShadow: '0 2px 4px rgba(0,0,0,1)' }}
                                            >
                                                {prize.label}
                                            </span>
                                        </div>
                                    );
                                })}
                                {/* Center Hub */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#0a0c0a] border-4 border-[#00ffa3] z-10 flex items-center justify-center font-bold text-[#00ffa3]">
                                    🐸
                                </div>
                            </div>
                        </div>

                        {/* RESULTS & CTA */}
                        <div className="h-20 flex flex-col justify-center">
                            {reward ? (
                                <div className="animate-bounce">
                                    <div className="font-mono text-gray-400 text-xs uppercase tracking-widest mb-1">Extracted</div>
                                    <div className="font-black italic text-4xl text-[#00ffa3]">{reward.label}</div>
                                </div>
                            ) : (
                                <button
                                    onClick={spin}
                                    disabled={!canSpin || isSpinning}
                                    className={`w-full py-4 rounded font-black italic uppercase tracking-widest transition-all ${isSpinning ? 'bg-white/10 text-gray-500 cursor-not-allowed' :
                                        !canSpin ? 'bg-white/5 text-gray-600 border border-white/10' :
                                            'bg-[#00ffa3] text-black hover:bg-white shadow-[0_0_20px_rgba(0,255,163,0.3)]'
                                        }`}
                                >
                                    {isSpinning ? 'CALCULATING...' : !canSpin ? 'RETURN IN 24H' : 'INITIATE EXTRACTION'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
