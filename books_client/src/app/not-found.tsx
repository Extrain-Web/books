"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuArrowLeft, LuHouse, LuShoppingBag, LuSearch, LuPhoneCall, LuCompass } from 'react-icons/lu';

export default function NotFound() {
    const router = useRouter();

    const handleGoBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-16">
            <div className="max-w-xl w-full text-center">
                {/* ── 404 Illustration / Graphic ── */}
                <div className="relative mb-8 select-none">
                    <div className="text-[120px] sm:text-[160px] font-black text-gray-100 tracking-tighter leading-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[var(--color-primary-lightest)]/60 border-2 border-[var(--color-primary)]/20 flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/10 backdrop-blur-xs transform -rotate-6">
                            <LuCompass size={42} className="text-[var(--color-primary)] animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* ── Heading & Text ── */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
                    Oops! Page Not Found
                </h1>
                <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto leading-relaxed mb-8">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                {/* ── Action Buttons ── */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
                    >
                        <LuArrowLeft size={16} />
                        Go Back
                    </button>

                    <Link
                        href="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-sm rounded-xl shadow-md shadow-[var(--color-primary)]/25 transition-all hover:shadow-lg active:scale-98"
                    >
                        <LuHouse size={16} />
                        Back to Home
                    </Link>
                </div>

                {/* ── Quick Links Helper ── */}
                <div className="pt-8 border-t border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                        Or try visiting
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100/80 hover:bg-[var(--color-primary-lightest)] text-gray-600 hover:text-[var(--color-primary)] text-xs font-medium transition-colors"
                        >
                            <LuShoppingBag size={13} />
                            All Products
                        </Link>
                        <Link
                            href="/cart"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100/80 hover:bg-[var(--color-primary-lightest)] text-gray-600 hover:text-[var(--color-primary)] text-xs font-medium transition-colors"
                        >
                            <LuSearch size={13} />
                            View Cart
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100/80 hover:bg-[var(--color-primary-lightest)] text-gray-600 hover:text-[var(--color-primary)] text-xs font-medium transition-colors"
                        >
                            <LuPhoneCall size={13} />
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
