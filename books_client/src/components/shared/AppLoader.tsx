/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export default function AppLoader() {
    const { storeName, isLoaded } = useTheme();
    const [progress, setProgress] = useState(12);
    const [isComplete, setIsComplete] = useState(false);
    const [isRemoved, setIsRemoved] = useState(false);

    useEffect(() => {
        // Prevent background scrolling while loading
        if (!isComplete) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isComplete]);

    useEffect(() => {
        // Animate progress smoothly
        let current = 12;
        const interval = setInterval(() => {
            // Speed up if site data is ready
            const step = isLoaded ? (current > 75 ? 8 : 12) : (current > 80 ? 1 : 4);
            current = Math.min(isLoaded ? 100 : 92, current + step);
            setProgress(current);

            if (current >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    setIsComplete(true);
                    setTimeout(() => {
                        setIsRemoved(true);
                    }, 450); // wait for fade transition
                }, 250);
            }
        }, 40);

        // Fallback safety timeout (max 2.2 seconds) so user is never blocked
        const safetyTimeout = setTimeout(() => {
            setProgress(100);
            setTimeout(() => {
                setIsComplete(true);
                setTimeout(() => {
                    setIsRemoved(true);
                }, 450);
            }, 150);
        }, 2200);

        return () => {
            clearInterval(interval);
            clearTimeout(safetyTimeout);
        };
    }, [isLoaded]);

    if (isRemoved) return null;

    const brandLogo = '/Books-River-Logo-Colored.png';

    return (
        <div
            className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white transition-all duration-400 ease-out ${
                isComplete ? 'opacity-0 pointer-events-none scale-[1.02]' : 'opacity-100'
            }`}
            style={{ minHeight: '100dvh' }}
            aria-hidden={isComplete}
        >
            <div className="flex flex-col items-center justify-center px-6 max-w-sm w-full -mt-8 select-none">
                
                {/* ── Brand Logo ── */}
                <div className="mb-8 flex items-center justify-center h-20 transition-transform duration-300">
                    <img
                        src={brandLogo}
                        alt={storeName || "Books River"}
                        className="max-h-20 w-auto object-contain drop-shadow-sm animate-[fadeIn_0.5s_ease-out]"
                    />
                </div>

                {/* ── Percentage Counter ── */}
                <div className="flex items-baseline justify-center gap-1 mb-8 font-black tabular-nums">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                        {Math.round(progress)}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">
                        %
                    </span>
                </div>

                {/* ── Progress Track with Delivery Truck ── */}
                <div className="relative w-full max-w-[280px] sm:max-w-[320px] mb-6">
                    {/* Background track */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        {/* Progress Fill */}
                        <div
                            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[#1b2a4a] rounded-full transition-all duration-100 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Animated Delivery Truck positioned along the track */}
                    <div
                        className="absolute top-1/2 transition-all duration-100 ease-out pointer-events-none"
                        style={{
                            left: `${progress}%`,
                            transform: 'translate(-50%, -85%)',
                        }}
                    >
                        <div className="relative w-10 h-7 flex items-center justify-center drop-shadow-sm animate-[truckBounce_0.6s_ease-in-out_infinite_alternate]">
                            {/* Delivery Truck SVG matching Books River brand colours */}
                            <svg
                                viewBox="0 0 48 32"
                                className="w-10 h-7"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Cargo Container in Brand Blue */}
                                <rect x="2" y="4" width="28" height="20" rx="2" fill="#F08418" />
                                <rect x="4" y="6" width="24" height="16" rx="1" fill="#ffffff" opacity="0.3" />
                                <line x1="16" y1="4" x2="16" y2="24" stroke="#c96a12" strokeWidth="1.5" />
                                
                                {/* Cabin */}
                                <path
                                    d="M30 11H38L44 17V24H30V11Z"
                                    fill="#1E293B"
                                />
                                {/* Windshield */}
                                <path
                                    d="M32 13H37L41.5 17.5H32V13Z"
                                    fill="#BAE6FD"
                                />
                                {/* Headlight */}
                                <rect x="43" y="20" width="2" height="3" rx="0.5" fill="#FEF08A" />

                                {/* Bumper */}
                                <rect x="28" y="23" width="17" height="2" fill="#475569" />

                                {/* Wheels */}
                                <circle cx="10" cy="24" r="4.5" fill="#0F172A" />
                                <circle cx="10" cy="24" r="2" fill="#94A3B8" />
                                
                                <circle cx="37" cy="24" r="4.5" fill="#0F172A" />
                                <circle cx="37" cy="24" r="2" fill="#94A3B8" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* ── Subtitle with pulsating dots ── */}
                <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500">
                    <span>Almost ready...</span>
                    <span className="flex gap-1 items-center ml-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-[dotPulse_1.4s_infinite_ease-in-out_0s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-[dotPulse_1.4s_infinite_ease-in-out_0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-[dotPulse_1.4s_infinite_ease-in-out_0.4s]" />
                    </span>
                </div>

            </div>

            {/* Micro-animations */}
            <style jsx global>{`
                @keyframes truckBounce {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-2px); }
                }
                @keyframes dotPulse {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40% { transform: scale(1.2); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
