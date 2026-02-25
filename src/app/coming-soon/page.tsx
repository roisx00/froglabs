'use client';

import React, { useEffect, useState } from 'react';
import './coming-soon.css';

export default function ComingSoon() {
    const [time, setTime] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <main className="comingSoonWrapper">
            <div className="gridOverlay"></div>
            <div className="scanLine"></div>

            {/* Industrial HUD Data Overlays */}
            <div className="hudData hud-tl">
                RIBBIT_SYS_LOAD: 1.0.4 - [STABLE]<br />
                SECTOR: 0xFF.01 // REBOOT_REQUIRED<br />
                CORE_VOLTAGE: 1.25V // TEMP: 28°C
            </div>
            <div className="hudData hud-tr">
                LAT_COORDS: 48.8584° N<br />
                LON_COORDS: 2.2945° E<br />
                SYSTEM_TIME: {time || '00:00:00'}
            </div>
            <div className="hudData hud-bl">
                UPLINK_STATUS: ENCRYPTED_GCM<br />
                PACKET_LOSS: 0.00%<br />
                SIGNAL_STRENGTH: 104dBm
            </div>
            <div className="hudData hud-br">
                MEMORY_USAGE: 256MB/8GB<br />
                DISK_AVAIL: 1.2TB<br />
                KERNEL: LNX_v6.1.0-RIBBIT
            </div>

            <div className="content">
                {/* Tactical Corner Brackets */}
                <div className="tacticalCorner corner-tl"></div>
                <div className="tacticalCorner corner-tr"></div>
                <div className="tacticalCorner corner-bl"></div>
                <div className="tacticalCorner corner-br"></div>

                <div className="logoBox">
                    <div className="preTitle">Tactical Infiltration Phase</div>
                    <h1 className="heroTitle">
                        <span>RIBBIT</span>
                        <span>ROYALE</span>
                    </h1>
                </div>

                <div className="statusBadge">
                    <div className="statusIndicator"></div>
                    <span>SYSTEM_ONLINE: COMING_SOON</span>
                </div>

                <p className="description">
                    Executing a full tactical reboot of the amphibious paradigm.
                    Establishing high-intensity downlink for early bird deployment.
                </p>

                <div style={{ marginBottom: '3rem' }}>
                    <a href="https://www.whitelist.ribbitroyale.fun/" className="btnPortal">
                        [ ACCESS_WHITELIST_PORTAL ]
                    </a>
                </div>

                <form className="signupGroup" onSubmit={(e) => e.preventDefault()}>
                    <input
                        className="emailInput"
                        type="email"
                        placeholder="INPUT_EMAIL_FOR_DEPLOYMENT_ALERTS"
                        autoComplete="off"
                    />
                    <button className="btnNotify" type="submit">EXECUTE_NOTIFICATION</button>
                </form>

                <div className="socials">
                    <a href="https://discord.gg/5g6M2vT6W7" target="_blank" rel="noopener noreferrer" className="socialLink">
                        [ Discord_Intel ]
                    </a>
                    <a href="https://x.com/22RibbitRoyale" target="_blank" rel="noopener noreferrer" className="socialLink">
                        [ X_Communications ]
                    </a>
                </div>
            </div>

            <footer className="comingSoonFooter">
                &gt;&gt; ESTABLISHING_SECURE_LINK // TARGET_LOCKED_001 // BY_RIBBITLABS_TECH
            </footer>
        </main>
    );
}
