"use client";

import React from 'react';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';

const CtaBanner: React.FC = () => {
    return (
        <section className="w-full relative overflow-hidden">
            {/* Background — indigo gradient */}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(120deg, var(--color-primary) 0%, var(--color-primary-dark) 55%, var(--color-primary) 100%)' }}
            />
            {/* Decorative blobs */}
            <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-white/[0.06]" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-white/[0.05]" />

            {/* Content */}
            <div className="relative container mx-auto px-4 py-16 md:py-20 text-center">
                <span className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xs text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase text-white/90 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" /> WHOLESALE TO SHOPS &amp; SCHOOLS
                </span>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                    Your school&apos;s next term, fully stocked.
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-white/85 mb-8 max-w-2xl mx-auto leading-relaxed font-normal">
                    As a wholesale supplier, we provide bulk book orders for schools, coaching centers, and retail shops
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 bg-white text-[var(--color-primary)] font-bold text-sm md:text-base px-8 py-3.5 rounded-xl hover:bg-slate-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-black/10 w-full sm:w-auto"
                    >
                        Book a Free Consultation <LuArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CtaBanner;
