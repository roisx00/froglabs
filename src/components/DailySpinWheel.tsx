'use client';

import { useState, useEffect } from 'react';

// Wheel configuration
const SLICES = [
    { label: '5 XP', value: 5, color: '#111111', weight: 40 },
    { label: '10 XP', value: 10, color: '#1a1a1a', weight: 30 },
    { label: '15 XP', value: 15, color: '#222222', weight: 15 },
    { label: '20 XP', value: 20, color: '#2a2a2a', weight: 8 },
    { label: '30 XP', value: 30, color: '#00ffa3', textColor: '#000', weight: 4 }, // Uncommon
    { label: '50 XP', value: 50, color: '#ffae00', textColor: '#000', weight: 2 }, // Rare
    { label: '100 XP', value: 100, color: '#ff0055', textColor: '#fff', weight: 1 }, // Legendary
];

const TOTAL_WEIGHT = SLICES.reduce((acc, slice) => acc + slice.weight, 0);

export default function DailySpinWheel() {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<typeof SLICES[0] | null>(null);
    const [canSpin, setCanSpin] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        // Mock cooldown logic (in a real app, check DB timestamp)
        const lastSpin = localStorage.getItem('lastSpinTime');
        if (lastSpin) {
            const timeDiff = Date.now() - parseInt(lastSpin);
            const hours24 = 24 * 60 * 60 * 1000;
            if (timeDiff < hours24) {
                setCanSpin(false);
                updateTimer(hours24 - timeDiff);
                const timerId = setInterval(() => {
                    const newDiff = Date.now() - parseInt(lastSpin);
                    if (newDiff >= hours24) {
                        setCanSpin(true);
                        clearInterval(timerId);
                    } else {
                        updateTimer(hours24 - newDiff);
                    }
                }, 1000);
                return () => clearInterval(timerId);
            }
        }
    }, [isSpinning]);

    const updateTimer = (ms: number) => {
        const h = Math.floor(ms / (1000 * 60 * 60));
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((ms % (1000 * 60)) / 1000);
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    const spinWheel = () => {
        if (!canSpin || isSpinning) return;

        setIsSpinning(true);
        setResult(null);

        // Calculate weighted random winner
        let randomWeight = Math.random() * TOTAL_WEIGHT;
        let selectedIndex = 0;

        for (let i = 0; i < SLICES.length; i++) {
            randomWeight -= SLICES[i].weight;
            if (randomWeight <= 0) {
                selectedIndex = i;
                break;
            }
        }

        // Calculate rotation (multiple full spins + offset to target slice)
        const sliceAngle = 360 / SLICES.length;
        const targetRotation = (360 * 5) + (360 - (selectedIndex * sliceAngle)); // 5 extra spins for effect

        // Add a slight random offset within the slice so it doesn't land exactly center every time
        const randomOffset = (Math.random() * (sliceAngle * 0.8)) - (sliceAngle * 0.4);

        setRotation(prev => prev + targetRotation + randomOffset);

        // Wait for animation to finish
        setTimeout(() => {
            setIsSpinning(false);
            setResult(SLICES[selectedIndex]);
            setCanSpin(false);
            localStorage.setItem('lastSpinTime', Date.now().toString());
            updateTimer(24 * 60 * 60 * 1000);

            // Dispatch event to update global XP (mocking this for demo)
            // window.dispatchEvent(new CustomEvent('xpAwarded', { detail: SLICES[selectedIndex].value }));
        }, 5000); // 5s match the css transition
    };

    return (
        <div className="bg-[#050505] border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden flex flex-col items-center">
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,#00ffa310_0%,transparent_50%)] pointer-events-none"></div>

            <div className="text-center mb-10 relative z-10">
                <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter mb-2">
                    THE <span className="text-[#00ffa3]">RIBBIT</span> WHEEL
                </h2>
                <p className="text-gray-500 text-xs uppercase tracking-[0.3em]">Daily login sequence. Extract your XP.</p>
            </div>

            <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] mb-12">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"></div>
                <div className={`absolute inset-[-10px] rounded-full border border-[#00ffa3]/20 ${isSpinning ? 'animate-ping duration-[3s]' : ''}`}></div>

                {/* The Wheel */}
                <div
                    className="w-full h-full rounded-full overflow-hidden border-4 border-[#111] relative shadow-inner"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 5s cubic-bezier(0.15, 0.9, 0.25, 1)',
                    }}
                >
                    {SLICES.map((slice, i) => {
                        const angle = 360 / SLICES.length;
                        const rotationAngle = i * angle;
                        return (
                            <div
                                key={i}
                                className="absolute w-[50%] h-[50%] origin-bottom-right"
                                style={{
                                    backgroundColor: slice.color,
                                    transform: `rotate(${rotationAngle}deg) skewY(${90 - angle}deg)`,
                                    top: 0,
                                    left: 0
                                }}
                            >
                                <div
                                    className="absolute inset-0 flex items-center justify-center font-black text-lg tracking-tighter"
                                    style={{
                                        color: slice.textColor || '#fff',
                                        transform: `skewY(-${90 - angle}deg) rotate(${angle / 2}deg) translate(20px, -40px)`,
                                        textShadow: slice.textColor === '#000' ? 'none' : '0 2px 4px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {slice.label}
                                </div>
                            </div>
                        );
                    })}
                    {/* Wheel Center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#000] border-4 border-[#222] rounded-full z-20 flex items-center justify-center shadow-xl">
                        <span className="text-2xl">🐸</span>
                    </div>
                </div>

                {/* Selection Pointer (Top) */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-12 z-30 filter drop-shadow-[0_0_10px_rgba(0,255,163,0.5)]">
                    <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-[#00ffa3]"></div>
                </div>
            </div>

            {/* Controls / Status */}
            <div className="relative z-10 text-center w-full max-w-xs">
                {canSpin ? (
                    <button
                        onClick={spinWheel}
                        disabled={isSpinning}
                        className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all ${isSpinning
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-[#00ffa3] text-black hover:bg-white hover:shadow-[0_0_40px_rgba(0,255,163,0.4)] hover:-translate-y-1'
                            }`}
                    >
                        {isSpinning ? 'SPINNING...' : 'SPIN WHEEL'}
                    </button>
                ) : (
                    <div className="bg-white/5 border border-white/10 rounded-2xl py-5 px-6 backdrop-blur-sm">
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-1 font-bold">NEXT EXTRACT IN:</div>
                        <div className="text-2xl font-mono font-bold text-white tracking-widest">{timeLeft}</div>
                    </div>
                )}
            </div>

            {/* Result Modal Overlay */}
            {result && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="text-6xl mb-6 animate-bounce">🐸</div>
                    <div className="text-[#00ffa3] font-mono text-[10px] tracking-[0.5em] uppercase mb-2">REWARD SECURED</div>
                    <div className="text-7xl md:text-8xl font-black text-white italic tracking-tighter mb-8" style={{ textShadow: `0 0 40px ${result.color}66` }}>
                        +{result.value} <span className="text-4xl">XP</span>
                    </div>
                    <button
                        onClick={() => setResult(null)}
                        className="px-8 py-3 border border-white/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors text-gray-300"
                    >
                        ACKNOWLEDGE
                    </button>
                </div>
            )}
        </div>
    );
}
