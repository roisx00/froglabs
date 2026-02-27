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

            // Premium vibration and excitement build-up
            setTimeout(() => {
                if (data.success) {
                    setReward(data);
                    setStatus('opened');
                    onSuccess(); // Refresh dashboard data
                } else {
                    alert('Could not open: ' + (data.reason || 'Unknown error'));
                    setStatus('ineligible');
                }
            }, 2500);
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
                <div className="premium-glow-bg"></div>

                {status !== 'opened' ? (
                    <div className="mystery-box-container">
                        <div className="header-stack">
                            <h1 className="main-title">RIBBIT MYSTERY BOX</h1>
                            <div className="badge">
                                <span>{globalCount}/500 CLAIMED</span>
                            </div>
                        </div>

                        <div className={`chest-wrapper ${status === 'opening' ? 'intense-vibration' : 'idle-float'}`}>
                            <img src="/img/mystery_box_v4.png" alt="Mystery Box" className="mystery-chest-img" />
                            {status === 'opening' && <div className="opening-burst"></div>}
                        </div>

                        <div className="button-container">
                            <button
                                className={`btn-unbox ${status === 'opening' ? 'opening' : ''}`}
                                onClick={handleOpen}
                                disabled={status === 'opening'}
                            >
                                {status === 'opening' ? 'UNLOCKING...' : 'OPEN BOX'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="reward-reveal-container">
                        <div className="celebration-particles"></div>
                        <h2 className="victory-text">TREASURE UNLOCKED</h2>

                        <div className="reward-bloom-stage">
                            <div className="green-reveal-glow"></div>
                            <div className="reward-card-premium">
                                {reward?.rewardType === 'xp' ? (
                                    <div className="reward-content">
                                        <div className="reward-icon-reveal">⚡</div>
                                        <div className="reward-amount">{reward.xpAmount} XP</div>
                                        <div className="reward-desc text-green">SOCIAL EXPERIENCE POINT</div>
                                    </div>
                                ) : (
                                    <div className="reward-content">
                                        <div className="reward-icon-reveal">👑</div>
                                        <div className="reward-amount">{reward.roleName}</div>
                                        <div className="reward-desc text-green">DISCORD PRIVILEGE GRANTED</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button className="btn-claim-exit" onClick={() => setStatus('ineligible')}>
                            CLAIM REWARD
                        </button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .mystery-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(25px) saturate(180%);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.4s ease-out;
                }
                .mystery-modal-content {
                    background: #FFFFFF;
                    border: 8px solid #1B4432;
                    border-radius: 50px;
                    padding: 60px;
                    width: 90%;
                    max-width: 750px;
                    min-height: 600px;
                    text-align: center;
                    box-shadow: 0 50px 100px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(27, 68, 50, 0.05);
                    position: relative;
                    overflow: hidden;
                    animation: popUpLarge 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                
                .premium-glow-bg {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at 50% 50%, rgba(45, 106, 79, 0.05) 0%, transparent 80%);
                    pointer-events: none;
                }

                .header-stack {
                    margin-bottom: 30px;
                }
                .main-title {
                    font-family: 'Inter', sans-serif;
                    font-size: 3.2rem;
                    font-weight: 950;
                    color: #1A1A1A;
                    letter-spacing: -2px;
                    line-height: 0.9;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                }
                .badge {
                    display: inline-block;
                    background: #1B4432;
                    color: #FFFFFF;
                    font-family: 'Space Mono', monospace;
                    font-size: 0.85rem;
                    font-weight: 800;
                    padding: 6px 16px;
                    border-radius: 100px;
                    letter-spacing: 2px;
                }

                .chest-wrapper {
                    position: relative;
                    width: 400px;
                    height: 400px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .mystery-chest-img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    filter: drop-shadow(0 30px 60px rgba(0,0,0,0.35));
                }

                .idle-float {
                    animation: premiumFloat 4s ease-in-out infinite;
                }
                .intense-vibration {
                    animation: vibrate 0.1s linear infinite;
                }
                .opening-burst {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle, rgba(82, 183, 136, 0.4) 0%, transparent 70%);
                    animation: burstScale 0.5s ease-out infinite;
                    z-index: -1;
                }

                .button-container {
                    margin-top: 40px;
                    width: 100%;
                    max-width: 450px;
                }
                .btn-unbox {
                    background: #1B4432;
                    border: none;
                    color: #FFFFFF;
                    font-family: 'Space Mono', monospace;
                    font-weight: 900;
                    font-size: 1.4rem;
                    padding: 24px 0;
                    width: 100%;
                    border-radius: 25px;
                    cursor: pointer;
                    box-shadow: 0 12px 0 #0D261B, 0 20px 40px rgba(27, 68, 50, 0.2);
                    transition: all 0.15s;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                }
                .btn-unbox:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 14px 0 #0D261B, 0 25px 50px rgba(27, 68, 50, 0.3);
                }
                .btn-unbox:active:not(:disabled) {
                    transform: translateY(8px);
                    box-shadow: 0 4px 0 #0D261B;
                }

                /* Reward Reveal Stage */
                .reward-reveal-container {
                    width: 100%;
                    animation: fadeIn 0.8s ease-out;
                }
                .victory-text {
                    font-size: 3rem;
                    font-weight: 950;
                    color: #1B4432;
                    letter-spacing: -1.5px;
                    margin-bottom: 30px;
                }
                .reward-bloom-stage {
                    position: relative;
                    padding: 40px;
                    margin-bottom: 40px;
                }
                .green-reveal-glow {
                    position: absolute;
                    inset: -50px;
                    background: radial-gradient(circle, rgba(45, 106, 79, 0.6) 0%, rgba(82, 183, 136, 0.2) 40%, transparent 70%);
                    filter: blur(40px);
                    animation: glowRotate 4s linear infinite;
                    z-index: 0;
                }
                .reward-card-premium {
                    background: #FFFFFF;
                    border: 4px solid #1B4432;
                    border-radius: 35px;
                    padding: 60px 40px;
                    position: relative;
                    z-index: 1;
                    box-shadow: 0 30px 60px rgba(27, 68, 50, 0.15);
                    animation: rewardPopUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.4);
                }
                .reward-icon-reveal {
                    font-size: 7rem;
                    margin-bottom: 20px;
                    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.1));
                }
                .reward-amount {
                    font-size: 4rem;
                    font-weight: 1000;
                    color: #1A1A1A;
                    letter-spacing: -2px;
                    line-height: 1;
                }
                .reward-desc {
                    font-family: 'Space Mono', monospace;
                    font-size: 0.9rem;
                    font-weight: 800;
                    letter-spacing: 3px;
                    margin-top: 15px;
                }
                .text-green { color: #2D6A4F; }

                .btn-claim-exit {
                    background: #FFFFFF;
                    border: 3px solid #1B4432;
                    color: #1B4432;
                    font-family: 'Space Mono', monospace;
                    font-weight: 900;
                    font-size: 1.1rem;
                    padding: 20px 50px;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-claim-exit:hover {
                    background: #F0F7F3;
                    letter-spacing: 2px;
                }

                @keyframes premiumFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-30px); }
                }
                @keyframes vibrate {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                @keyframes glowRotate {
                    0% { transform: rotate(0deg) scale(1); opacity: 0.6; }
                    50% { transform: rotate(180deg) scale(1.2); opacity: 1; }
                    100% { transform: rotate(360deg) scale(1); opacity: 0.6; }
                }
                @keyframes burstScale {
                    from { transform: scale(0.8); opacity: 0.8; }
                    to { transform: scale(1.5); opacity: 0; }
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popUpLarge {
                    from { transform: scale(0.85) translateY(60px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes rewardPopUp {
                    from { transform: scale(0) rotate(-10deg); opacity: 0; }
                    to { transform: scale(1) rotate(0deg); opacity: 1; }
                }

                @media (max-width: 640px) {
                    .mystery-modal-content {
                        padding: 30px 15px;
                        border-radius: 35px;
                        min-height: auto;
                        width: 92%;
                    }
                    .main-title { font-size: 1.8rem; letter-spacing: -1px; }
                    .victory-text { font-size: 1.8rem; margin-bottom: 20px; }
                    .chest-wrapper { width: 220px; height: 220px; }
                    .reward-bloom-stage { padding: 15px; margin-bottom: 25px; }
                    .reward-card-premium { padding: 30px 15px; border-radius: 25px; }
                    .reward-amount { font-size: 2.2rem; letter-spacing: -1px; }
                    .reward-icon-reveal { font-size: 3.5rem; margin-bottom: 10px; }
                    .reward-desc { font-size: 0.75rem; letter-spacing: 2px; }
                    .btn-unbox { font-size: 1.1rem; padding: 18px 0; border-radius: 18px; }
                    .btn-claim-exit { padding: 15px 35px; font-size: 1rem; }
                }
            `}</style>
        </div>
    );
}
