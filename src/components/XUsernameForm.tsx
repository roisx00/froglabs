'use client';

import { useState } from 'react';

export default function XUsernameForm() {
    const [username, setUsername] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.length > 0) {
            setSubmitted(true);
            // In a real app, this would be an API call
        }
    };

    if (submitted) {
        return (
            <div className="bg-[#00ffa3]/10 border border-[#00ffa3]/30 p-6 rounded-[2rem] flex items-center gap-4 animate-in fade-in zoom-in duration-500">
                <div className="w-12 h-12 bg-[#00ffa3]/20 rounded-full flex items-center justify-center text-[#00ffa3] text-xl">
                    ✓
                </div>
                <div>
                    <h3 className="text-[#00ffa3] font-black uppercase tracking-widest text-sm">X Account Linked</h3>
                    <p className="text-gray-400 text-xs">@{username}</p>
                </div>
                <div className="ml-auto text-xs font-mono text-[#00ffa3]/60 pr-4">
                    +50 XP DEPOSITED
                </div>
            </div>
        );
    }

    return (
        <div className="relative group">
            {/* Holographic background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00ffa3]/0 via-[#00ffa3]/5 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="bg-[#080808] border border-white/5 p-6 md:p-8 rounded-[2rem] relative z-10 transition-all duration-300 group-hover:border-[#00ffa3]/20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1">WHAT IS YOUR X USERNAME?</h2>
                        <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-medium">Link your account to verify your syndicate status.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex w-full md:w-auto gap-3">
                        <div className="relative flex-1 md:w-64">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                                placeholder="username"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00ffa3] focus:ring-1 focus:ring-[#00ffa3] transition-all font-mono text-sm"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-white text-black px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#00ffa3] transition-colors whitespace-nowrap"
                        >
                            Submit
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
