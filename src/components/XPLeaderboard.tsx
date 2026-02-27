'use client';

import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function XPLeaderboard() {
    const { data: leaderboard, error } = useSWR('/api/leaderboard', fetcher, {
        refreshInterval: 10000 // refresh every 10 seconds for real-time feel
    });

    const isLoading = !leaderboard && !error;
    const users = leaderboard || [];
    return (
        <div className="bg-[#050505] border border-white/5 rounded-[2rem] p-6 md:p-8 h-full">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter mb-1">GLOBAL RANKINGS</h3>
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">Top XP Earners</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">
                    🏆
                </div>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center text-gray-500 text-xs font-mono py-8 uppercase tracking-widest animate-pulse">
                        Synchronizing real-time data...
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center text-gray-500 text-xs font-mono py-8 uppercase tracking-widest">
                        No agents found in the system.
                    </div>
                ) : (
                    users.map((user: any, index: number) => (
                        <div
                            key={index}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${index === 0 ? 'bg-[#ffae00]/10 border-[#ffae00]/30' :
                                index === 1 ? 'bg-gray-300/10 border-gray-300/30' :
                                    index === 2 ? 'bg-[#b08d57]/10 border-[#b08d57]/30' :
                                        'bg-white/5 border-transparent hover:border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`font-black text-sm w-4 ${index === 0 ? 'text-[#ffae00]' :
                                    index === 1 ? 'text-gray-300' :
                                        index === 2 ? 'text-[#b08d57]' :
                                            'text-gray-600'
                                    }`}>
                                    #{user.rank}
                                </span>
                                <div>
                                    <div className="font-bold text-sm text-white">{user.username}</div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest">{user.tier}</div>
                                </div>
                            </div>
                            <div className="font-mono font-bold text-[#00ffa3] text-sm">
                                {user.xp.toLocaleString('en-US')} XP
                            </div>
                        </div>
                    )))}
            </div>

            <button className="w-full mt-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
                View Full Leaderboard
            </button>
        </div>
    );
}
