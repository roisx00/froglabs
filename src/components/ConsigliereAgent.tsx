'use client';

import { useEffect, useState } from 'react';

interface ConsigliereAgentProps {
    app: any;
}

export default function ConsigliereAgent({ app }: ConsigliereAgentProps) {
    const [message, setMessage] = useState<string>('');
    const [visible, setVisible] = useState(false);

    const chatXP = app?.chatXP || 0;
    const socialXP = app?.socialXP || 0;
    const status = app?.status;

    useEffect(() => {
        // Generate Mob Directives
        let msg = "Welcome to the headquarters, kid. Don't touch anything.";

        if (status === 'approved') {
            msg = "Welcome to the family. Your GTD spot is secured. Don't make us regret it.";
        } else if (status === 'pending') {
            msg = "The Ribbitfather is reviewing your file. Stay clean. Stay active.";
        } else if (socialXP < 3000) {
            msg = `The streets are dry. We need Social Intel. Execute those X tasks. You need ${3000 - socialXP} more XP for Croak Knight clearance.`;
        } else if (chatXP < 1000) {
            msg = `You're close to being a Runner. Hit the Discord and make some noise. Only ${1000 - chatXP} XP to go.`;
        } else if (chatXP < 3000) {
            msg = `You're a Runner now, but can you be Royal? Prove it in the chat. ${3000 - chatXP} XP left for the crown.`;
        } else {
            msg = "You've got the XP, now file that application properly. The syndicate is waiting.";
        }

        setMessage(msg);

        // Appear with a delay
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
    }, [chatXP, socialXP, status]);

    if (!visible) return null;

    return (
        <div className="consigliere-agent">
            <div className="consigliere-badge">CONSIGLIERE</div>
            <div className="consigliere-content">
                <div className="consigliere-avatar">
                    🐸🎩
                </div>
                <div className="consigliere-text">
                    <p>{message}</p>
                </div>
            </div>
            <style jsx>{`
                .consigliere-agent {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 320px;
                    background: rgba(10, 15, 15, 0.9);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(0, 255, 163, 0.3);
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 163, 0.15);
                    z-index: 10000;
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    font-family: var(--font-mono, monospace);
                    border-bottom: 2px solid rgba(0, 255, 163, 0.5);
                }

                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .consigliere-badge {
                    position: absolute;
                    top: -12px;
                    left: 16px;
                    background: #00ffa3;
                    color: #000;
                    font-size: 0.65rem;
                    font-weight: 900;
                    padding: 3px 10px;
                    border-radius: 4px;
                    letter-spacing: 1px;
                    box-shadow: 0 4px 12px rgba(0, 255, 163, 0.4);
                }

                .consigliere-content {
                    display: flex;
                    gap: 14px;
                    align-items: center;
                }

                .consigliere-avatar {
                    font-size: 2rem;
                    background: rgba(0, 255, 163, 0.1);
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    border: 1px solid rgba(0, 255, 163, 0.3);
                    flex-shrink: 0;
                    box-shadow: inset 0 0 10px rgba(0, 255, 163, 0.1);
                }

                .consigliere-text p {
                    margin: 0;
                    color: #fff;
                    font-size: 0.85rem;
                    line-height: 1.5;
                    font-weight: 500;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                @media (max-width: 640px) {
                    .consigliere-agent {
                        bottom: 20px;
                        right: 12px;
                        left: 12px;
                        width: auto;
                        max-width: none;
                        padding: 14px;
                    }
                    
                    .consigliere-avatar {
                        width: 44px;
                        height: 44px;
                        font-size: 1.6rem;
                    }

                    .consigliere-text p {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
}
