'use client';

import { useState, useEffect } from 'react';

export default function MysteryBoxModal({ onSuccess }: { onSuccess: () => void }) {
    const [status, setStatus] = useState<'checking' | 'idle' | 'opening' | 'opened' | 'ineligible'>('checking');
    const [reward, setReward] = useState<any>(null);
    const [globalCount, setGlobalCount] = useState<number>(0);

    useEffect(() => {
        const checkEligibility = async () => {
            try {
                const res = await fetch('/api/mystery-box');
                const data = await res.json();

                if (data.globalCount !== undefined) {
                    setGlobalCount(data.globalCount);
                }

                if (data.eligible) {
                    setStatus('idle');
                } else {
                    setStatus('ineligible');
                }
            } catch (err) {
                console.error("Failed to check mystery box eligibility", err);
                setStatus('ineligible');
            }
        };
        checkEligibility();
    }, []);

    const handleOpen = async () => {
        if (status !== 'idle') return;
        setStatus('opening');

        try {
            const res = await fetch('/api/mystery-box', { method: 'POST' });
            const data = await res.json();

            // Professional anticipation delay
            setTimeout(() => {
                if (data.success) {
                    setReward(data);
                    setStatus('opened');
                    onSuccess(); // Refresh dashboard data
                } else {
                    alert('Could not open: ' + (data.reason || 'Unknown error'));
                    setStatus('ineligible');
                }
            }, 1800);
        } catch (err) {
            console.error("Box open failed:", err);
            setStatus('idle');
            alert('Failed to open the Mystery Box. Please try again.');
        }
    };

    if (status === 'checking' || status === 'ineligible') return null;

    return (
        <div className="mystery-modal-overlay">
            <div className="mystery-modal-content">
                <div className="corner-decor top-left"></div>
                <div className="corner-decor bottom-right"></div>

                {status !== 'opened' ? (
                    <div className="mystery-box-container">
                        <h1 className="main-title">RIBBIT MYSTERY BOX</h1>
                        <p className="subtitle">EARLY ACCESS REWARD &bull; {globalCount}/500 CLAIMED</p>

                        <div className={`gift-box-wrapper ${status === 'opening' ? 'opening-shake' : 'idle-float'}`}>
                            {/* Professional CSS/SVG Gift Box */}
                            <svg className="professional-gift" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
                                    </linearGradient>
                                    <filter id="shadowBox">
                                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(0,0,0,0.2)" />
                                    </filter>
                                </defs>
                                {/* Main Box Body */}
                                <rect x="40" y="80" width="120" height="100" rx="8" fill="url(#boxGrad)" filter="url(#shadowBox)" />
                                {/* Lid */}
                                <rect x="35" y="70" width="130" height="30" rx="4" fill="#FFC107" filter="url(#shadowBox)" />
                                {/* Vertical Ribbon */}
                                <rect x="90" y="70" width="20" height="110" fill="#E91E63" />
                                {/* Ribbon Loop Left */}
                                <path d="M100 70 C 70 30, 40 50, 90 70" fill="none" stroke="#E91E63" strokeWidth="12" strokeLinecap="round" />
                                {/* Ribbon Loop Right */}
                                <path d="M100 70 C 130 30, 160 50, 110 70" fill="none" stroke="#E91E63" strokeWidth="12" strokeLinecap="round" />
                                {/* Center Knot */}
                                <circle cx="100" cy="70" r="10" fill="#C2185B" />
                            </svg>
                            {status === 'opening' && <div className="opening-glow"></div>}
                        </div>

                        <button
                            className={`btn-primary-open ${status === 'opening' ? 'disabled' : ''}`}
                            onClick={handleOpen}
                            disabled={status === 'opening'}
                        >
                            {status === 'opening' ? 'UNBOXING...' : 'OPEN BOX'}
                        </button>
                    </div>
                ) : (
                    <div className="reward-container">
                        <div className=" confetti-rain"></div>
                        <h2 className="victory-title">CONGRATULATIONS!</h2>
                        <div className="reward-card-focus">
                            {reward?.rewardType === 'xp' ? (
                                <div className="reward-content">
                                    <span className="reward-icon-large">⚡</span>
                                    <span className="reward-value">+{reward.xpAmount} XP</span>
                                    <span className="reward-label">SOCIAL EXPERIENCE</span>
                                </div>
                            ) : (
                                <div className="reward-content">
                                    <span className="reward-icon-large">👑</span>
                                    <span className="reward-value">{reward.roleName}</span>
                                    <span className="reward-label">DISCORD ROLE UNLOCKED</span>
                                </div>
                            )}
                        </div>
                        <button className="btn-secondary-close" onClick={() => setStatus('ineligible')}>
                            CONTINUE TO DASHBOARD
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .mystery-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(12px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease-out;
                }
                .mystery-modal-content {
                    background: #FFFFFF;
                    border: 4px solid #1B4432;
                    border-radius: 40px;
                    padding: 80px 60px; /* Increased padding */
                    width: 90%;
                    max-width: 800px; /* BIGGER - Scaled up */
                    text-align: center;
                    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.25);
                    position: relative;
                    overflow: hidden;
                    animation: popUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2);
                }
                
                .corner-decor {
                    position: absolute;
                    width: 140px;
                    height: 140px;
                    background: #1B4432;
                    opacity: 0.04;
                    z-index: 0;
                }
                .top-left { top: -40px; left: -40px; border-radius: 50%; }
                .bottom-right { bottom: -40px; right: -40px; border-radius: 50%; }

                .main-title {
                    font-family: 'Inter', sans-serif;
                    font-size: 3.5rem; /* BIGGER */
                    font-weight: 900;
                    color: #1B4432;
                    margin-bottom: 8px;
                    letter-spacing: -2px;
                }
                .victory-title {
                    font-family: 'Inter', sans-serif;
                    font-size: 3rem;
                    font-weight: 800;
                    color: #2D6A4F;
                    margin-bottom: 24px;
                }
                .subtitle {
                    font-family: 'Space Mono', monospace;
                    color: #2D6A4F;
                    font-size: 0.9rem;
                    font-weight: 700;
                    letter-spacing: 2px;
                    opacity: 0.7;
                    margin-bottom: 40px;
                }

                .gift-box-wrapper {
                    margin: 20px auto 60px;
                    width: 280px; /* BIGGER */
                    height: 280px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .professional-gift {
                    width: 100%;
                    height: 100%;
                }
                .idle-float {
                    animation: float 3s ease-in-out infinite;
                }
                .opening-shake {
                    animation: shake 0.4s infinite linear;
                }
                .opening-glow {
                    position: absolute;
                    inset: -40px;
                    background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
                    z-index: -1;
                    filter: blur(20px);
                    animation: pulseGlow 0.5s infinite alternate;
                }

                .btn-primary-open {
                    background: #1B4432;
                    border: none;
                    color: #FFFFFF;
                    font-family: 'Space Mono', monospace;
                    font-weight: 800;
                    font-size: 1.3rem;
                    padding: 24px 60px;
                    border-radius: 20px;
                    cursor: pointer;
                    width: 100%;
                    max-width: 400px;
                    box-shadow: 0 10px 0 #0D261B;
                    transition: all 0.15s;
                }
                .btn-primary-open:hover:not(.disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 0 #0D261B;
                }
                .btn-primary-open:active:not(.disabled) {
                    transform: translateY(6px);
                    box-shadow: 0 4px 0 #0D261B;
                }
                .btn-primary-open.disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: 0 6px 0 #0D261B;
                }

                .reward-card-focus {
                    background: #F7FAF8;
                    border: 3px solid #E0EBE4;
                    border-radius: 32px;
                    padding: 60px 40px;
                    margin-bottom: 40px;
                    animation: popScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2);
                }
                .reward-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .reward-icon-large {
                    font-size: 6rem;
                    margin-bottom: 20px;
                    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
                }
                .reward-value {
                    font-size: 3.5rem;
                    font-weight: 950;
                    color: #1B4432;
                    letter-spacing: -2px;
                    line-height: 1;
                }
                .reward-label {
                    font-family: 'Space Mono', monospace;
                    color: #2D6A4F;
                    font-size: 1rem;
                    font-weight: 700;
                    margin-top: 10px;
                    letter-spacing: 2px;
                }

                .btn-secondary-close {
                    background: #FFFFFF;
                    border: 3px solid #1B4432;
                    color: #1B4432;
                    font-family: 'Space Mono', monospace;
                    font-weight: 800;
                    font-size: 1.1rem;
                    padding: 18px 40px;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-secondary-close:hover {
                    background: #F0F7F3;
                    transform: scale(1.02);
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popUp { 
                    from { transform: scale(0.9) translateY(40px); opacity: 0; } 
                    to { transform: scale(1) translateY(0); opacity: 1; } 
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes shake {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-3deg); }
                    75% { transform: rotate(3deg); }
                    100% { transform: rotate(0deg); }
                }
                @keyframes pulseGlow {
                    from { opacity: 0.3; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1.2); }
                }
                @keyframes popScale {
                    from { transform: scale(0.6); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                @media (max-width: 640px) {
                    .mystery-modal-content {
                        padding: 40px 20px;
                        border-radius: 24px;
                        width: 95%;
                    }
                    .main-title {
                        font-size: 2rem;
                        letter-spacing: -1px;
                    }
                    .victory-title {
                        font-size: 1.8rem;
                        margin-bottom: 16px;
                    }
                    .subtitle {
                        font-size: 0.75rem;
                        margin-bottom: 24px;
                    }
                    .gift-box-wrapper {
                        width: 180px;
                        height: 180px;
                        margin: 10px auto 30px;
                    }
                    .btn-primary-open {
                        font-size: 1.1rem;
                        padding: 18px 40px;
                    }
                    .reward-card-focus {
                        padding: 30px 20px;
                        border-radius: 24px;
                        margin-bottom: 24px;
                    }
                    .reward-icon-large {
                        font-size: 4rem;
                    }
                    .reward-value {
                        font-size: 2.2rem;
                    }
                    .reward-label {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
}
