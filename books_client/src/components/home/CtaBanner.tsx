"use client";

import React from 'react';
import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';

const CtaBanner: React.FC = () => {
    return (
        <section className="w-full relative overflow-hidden">
            {/* Background — soft light orange */}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(120deg, var(--color-primary-lightest) 0%, var(--color-primary-light) 100%)' }}
            />

            {/* Content */}
            <div className="relative container mx-auto px-4 py-16 md:py-20 text-center">
                <span className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-white text-[11px] sm:text-xs font-bold tracking-[0.16em] uppercase border shadow-sm" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-border)' }}>
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" /> WHOLESALE TO SHOPS &amp; SCHOOLS
                </span>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight" style={{ color: '#2A1A12' }}>
                    Your school&apos;s next term, fully stocked.
                </h2>
                <p className="text-sm sm:text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed font-medium" style={{ color: '#6b5341' }}>
                    As a wholesale supplier, we provide bulk book orders for schools, coaching centers, and retail shops
                </p>

                {/* Button */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 text-white font-bold text-sm md:text-base px-8 py-3.5 rounded-xl hover:brightness-110 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-black/10 w-full sm:w-auto"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        Book a Free Consultation <LuArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default CtaBanner;
