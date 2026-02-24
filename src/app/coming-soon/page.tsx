'use client';

import React from 'react';
import './coming-soon.css';

export default function ComingSoon() {
    return (
        <main className="comingSoonWrapper">
            <div className="gridOverlay"></div>
            <div className="scanLine"></div>

            {/* Industrial Data Stats Overlays */}
            <div className="dataStats stats-tl">
                SYS_OS: FROG_KERNEL_v1.0.4<br />
                LOC: SECTOR_GRID_7.22<br />
                STATUS: AWAITING_DEPLOYMENT
            </div>
            <div className="dataStats stats-tr">
                LAT: 34.0522° N<br />
                LONG: 118.2437° W<br />
                TIME: {new Date().toISOString().split('T')[1].split('.')[0]}
            </div>
            <div className="dataStats stats-bl">
                ENCRYPTION: AES-256-GCM<br />
                UPLINK: ACTIVE<br />
                SIGNAL: 100%
            </div>

            <div className="content">
                {/* Tactical Corners */}
                <div className="tacticalCorner corner-tl"></div>
                <div className="tacticalCorner corner-tr"></div>
                <div className="tacticalCorner corner-bl"></div>
                <div className="tacticalCorner corner-br"></div>

                <div className="logoBox">
                    <div className="preTitle">Tactical Infiltration Phase</div>
                    <h1 className="heroTitle">
                        <span>FROG</span><br />
                        <span>ROYALE</span>
                    </h1>
                </div>

                <div className="statusBadge">
                    <div className="statusIndicator"></div>
                    <span>SYSTEM_ONLINE: COMING_SOON</span>
                </div>

                <p className="description">
                    A total tactical reboot of the amphibious paradigm is underway.
                    Establishing secure connection for early bird deployment.
                </p>

                <form className="signupGroup" onSubmit={(e) => e.preventDefault()}>
                    <div className="inputWrapper">
                        <input className="emailInput" type="email" placeholder="INPUT EMAIL FOR DEPLOYMENT ALERTS" />
                    </div>
                    <button className="btnNotify" type="submit">EXECUTE_NOTIFICATION</button>
                </form>

                <div className="socials">
                    <a href="#" className="socialLink">/ DISCORD.INTEL</a>
                    <a href="#" className="socialLink">/ X_COMMUNICATIONS</a>
                    <a href="#" className="socialLink">/ TELEGRAM_ENCRYPTED</a>
                </div>
            </div>

            <footer className="comingSoonFooter">
                &gt;&gt; UPLINK_ESTABLISHED // TARGET_LOCK_001
            </footer>
        </main>
    );
}
