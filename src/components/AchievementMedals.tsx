'use client';

import React from 'react';

interface AchievementMedalsProps {
    missionCount: number;
}

const AchievementMedals: React.FC<AchievementMedalsProps> = ({ missionCount }) => {
    const achievements = [
        { id: 't1', name: 'NOVICE OPERATIVE', target: 20, color: '#00F5FF', glow: 'rgba(0, 245, 255, 0.4)' },
        { id: 't2', name: 'FIELD AGENT', target: 50, color: '#39FF14', glow: 'rgba(57, 255, 20, 0.4)' },
        { id: 't3', name: 'SENIOR ANALYST', target: 100, color: '#FFD700', glow: 'rgba(255, 215, 0, 0.4)' },
        { id: 't4', name: 'CROAKER COMMANDO', target: 250, color: '#FF8C00', glow: 'rgba(255, 140, 0, 0.4)' },
        { id: 't5', name: 'ELITE SPEC-OPS', target: 500, color: '#FF0000', glow: 'rgba(255, 0, 0, 0.4)' },
        { id: 't6', name: 'MASTER TACTICIAN', target: 1000, color: '#9D00FF', glow: 'rgba(157, 0, 255, 0.4)' },
        { id: 't7', name: 'GRAND COMMANDER', target: 2500, color: '#0066FF', glow: 'rgba(0, 102, 255, 0.4)' },
        { id: 't8', name: 'NEURAL LEGEND', target: 5000, color: '#FF00FF', glow: 'rgba(255, 0, 255, 0.4)' },
        { id: 't9', name: 'SYNDICATE OVERLORD', target: 7500, color: '#E5E4E2', glow: 'rgba(229, 228, 226, 0.4)' },
        { id: 't10', name: 'RIBBIT ROYALTY', target: 10000, color: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)' },
    ];

    return (
        <div className="medals-container">
            <div className="section-header">
                <div>
                    <span className="section-title">ACHIEVEMENT PROTOCOL</span>
                    <h3 style={{ margin: 0, marginTop: '4px', fontSize: '1.2rem', fontWeight: 900 }}>MISSION PROGRESSION</h3>
                </div>
                <div className="mission-stats-group">
                    <span className="mission-stats">{missionCount.toLocaleString()} MISSIONS EXECUTED</span>
                </div>
            </div>

            <div className="medals-grid">
                {achievements.map((ach) => {
                    const isUnlocked = missionCount >= ach.target;
                    return (
                        <div key={ach.id} className={`medal-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                            <div className="medal-icon-wrapper">
                                <div className="medal-glow" style={{ background: ach.glow }}></div>
                                <svg className="medal-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15L14.39 16.26L13.93 13.59L15.87 11.7L13.19 11.31L12 8.89L10.81 11.31L8.13 11.7L10.07 13.59L9.61 16.26L12 15Z" fill={isUnlocked ? ach.color : '#333'} />
                                    <circle cx="12" cy="12" r="10" stroke={isUnlocked ? ach.color : '#222'} strokeWidth="2" />
                                    {ach.target >= 1000 && isUnlocked && (
                                        <circle cx="12" cy="12" r="12" stroke={ach.color} strokeWidth="1" strokeDasharray="2 2" />
                                    )}
                                </svg>
                            </div>
                            <div className="medal-info">
                                <div className="medal-name">{ach.name}</div>
                                <div className="medal-target">{ach.target.toLocaleString()}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .medals-container {
                    background: var(--bg-card);
                    border: 2px solid var(--text-primary);
                    border-radius: var(--radius-md);
                    padding: 24px;
                    margin-top: 20px;
                    box-shadow: 4px 4px 0px var(--text-primary);
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                }
                .section-title {
                    font-family: var(--font-mono);
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    letter-spacing: 2px;
                }
                .mission-stats {
                    font-family: var(--font-mono);
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--accent-green);
                    background: rgba(45, 106, 79, 0.08);
                    padding: 6px 12px;
                    border: 1px solid var(--accent-green);
                    border-radius: 4px;
                }
                .medals-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 12px;
                }
                @media (max-width: 1200px) {
                    .medals-grid { grid-template-columns: repeat(4, 1fr); }
                }
                @media (max-width: 900px) {
                    .medals-grid { grid-template-columns: repeat(2, 1fr); }
                }
                .medal-card {
                    position: relative;
                    background: var(--bg-base);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-sm);
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                .medal-card.locked {
                    opacity: 0.4;
                    background: rgba(0,0,0,0.02);
                }
                .medal-card.unlocked {
                    border-color: var(--text-primary);
                    background: white;
                }
                .medal-card.unlocked:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                }
                .medal-icon-wrapper {
                    position: relative;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .medal-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    filter: blur(12px);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .unlocked .medal-glow {
                    opacity: 0.3;
                }
                .medal-svg {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    z-index: 1;
                }
                .medal-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .medal-name {
                    font-family: var(--font-sans);
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    line-height: 1.1;
                    letter-spacing: -0.2px;
                }
                .medal-target {
                    font-family: var(--font-mono);
                    font-size: 0.65rem;
                    font-weight: 900;
                    color: var(--text-muted);
                }
                .unlocked .medal-target {
                    color: var(--text-primary);
                }
            `}</style>
        </div>
    );
};

export default AchievementMedals;
