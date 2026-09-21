/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from 'react';
import Link from 'next/link';
import { LuChevronRight, LuBookOpen, LuArrowRight } from 'react-icons/lu';
import { useGetCurriculumPageBySlugQuery } from '@/redux/api/curriculumPageApi';

/**
 * Curriculum Landing Page — renders a dynamic A-Level / O-Level style page
 * with grouped category buttons, similar to PeopleChoice's layout.
 *
 * Data is fully driven from the admin panel (CurriculumPage collection).
 */

/* ── Gradient helpers ── */
const darken = (hex: string, amount: number): string => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return `#${clamp(r * (1 - amount)).toString(16).padStart(2, '0')}${clamp(g * (1 - amount)).toString(16).padStart(2, '0')}${clamp(b * (1 - amount)).toString(16).padStart(2, '0')}`;
};

const lighten = (hex: string, amount: number): string => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return `#${clamp(r + (255 - r) * amount).toString(16).padStart(2, '0')}${clamp(g + (255 - g) * amount).toString(16).padStart(2, '0')}${clamp(b + (255 - b) * amount).toString(16).padStart(2, '0')}`;
};

const CurriculumLandingPage: React.FC<{ slug: string }> = ({ slug }) => {
    const { data, isLoading, isError } = useGetCurriculumPageBySlugQuery(slug);
    const page = data?.data;

    /* ── Loading ── */
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
                    />
                    <p className="text-sm text-gray-400 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    /* ── Not found ── */
    if (isError || !page) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" style={{ background: '#F8FAFC' }}>
                <div className="text-6xl mb-4">📚</div>
                <h1 className="text-xl font-bold text-gray-800 mb-1">Page not found</h1>
                <p className="text-sm text-gray-400 mb-6">
                    We couldn&apos;t find a curriculum page for &quot;{slug}&quot;.
                </p>
                <Link
                    href="/"
                    className="px-6 py-2.5 rounded-md text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--color-primary)' }}
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    const bannerColor = page.bannerColor || '#D32F2F';
    const groups = (page.groups || [])
        .filter((g: any) => g.active !== false)
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <div className="min-h-screen" style={{ background: '#F8FAFC' }}>

            {/* ════════ Hero Banner ════════ */}
            <section
                className="relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${bannerColor} 0%, ${darken(bannerColor, 0.35)} 100%)`,
                }}
            >
                {/* Decorative circles */}
                <div
                    className="absolute top-[-60px] right-[-60px] w-[200px] h-[200px] rounded-full opacity-10"
                    style={{ background: lighten(bannerColor, 0.3) }}
                />
                <div
                    className="absolute bottom-[-30px] left-[10%] w-[120px] h-[120px] rounded-full opacity-8"
                    style={{ background: lighten(bannerColor, 0.2) }}
                />

                <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 relative z-10">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1.5 text-[12px] text-white/60 mb-4">
                        <Link href="/" className="hover:text-white/90 transition-colors">Home</Link>
                        <LuChevronRight size={11} />
                        <span className="text-white font-medium">{page.title}</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                        {page.title}
                    </h1>
                    {page.description && (
                        <p className="mt-2 text-white/70 text-sm sm:text-base max-w-xl">
                            {page.description}
                        </p>
                    )}
                </div>
            </section>

            {/* ════════ Category Groups ════════ */}
            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">
                {groups.length === 0 ? (
                    <div className="text-center py-16">
                        <LuBookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-400 text-sm">No categories have been added yet.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 sm:gap-6">
                        {groups.map((group: any, gi: number) => {
                            const groupColor = group.bgColor || bannerColor;
                            const buttons = (group.buttons || [])
                                .filter((b: any) => b.active !== false)
                                .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

                            return (
                                <div
                                    key={group._id || gi}
                                    className="rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                                    style={{
                                        background: `linear-gradient(135deg, ${groupColor} 0%, ${darken(groupColor, 0.25)} 100%)`,
                                    }}
                                >
                                    {/* Group header */}
                                    <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4">
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight">
                                            {group.title}
                                        </h2>
                                    </div>

                                    {/* Buttons */}
                                    <div className="px-5 sm:px-7 pb-5 sm:pb-7">
                                        <div className="flex flex-wrap gap-2 sm:gap-2.5">
                                            {buttons.map((btn: any, bi: number) => {
                                                const catParam = (btn.categorySlugs && btn.categorySlugs.length > 0) 
                                                    ? btn.categorySlugs.join(',') 
                                                    : btn.categorySlug;
                                                const href = btn.customLink || (catParam ? `/products?category=${catParam}` : '#');
                                                return (
                                                    <Link
                                                        key={btn._id || bi}
                                                        href={href}
                                                        className="curriculum-chip"
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 16px',
                                                            borderRadius: '9999px',
                                                            background: 'rgba(255,255,255,0.18)',
                                                            backdropFilter: 'blur(6px)',
                                                            color: '#ffffff',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            lineHeight: '1.4',
                                                            border: '1px solid rgba(255,255,255,0.25)',
                                                            textDecoration: 'none',
                                                            transition: 'all 0.2s ease',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            const t = e.currentTarget;
                                                            t.style.background = 'rgba(255,255,255,0.92)';
                                                            t.style.color = groupColor;
                                                            t.style.borderColor = 'rgba(255,255,255,0.95)';
                                                            t.style.transform = 'translateY(-1px)';
                                                            t.style.boxShadow = '0 4px 14px rgba(0,0,0,0.12)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            const t = e.currentTarget;
                                                            t.style.background = 'rgba(255,255,255,0.18)';
                                                            t.style.color = '#ffffff';
                                                            t.style.borderColor = 'rgba(255,255,255,0.25)';
                                                            t.style.transform = 'translateY(0)';
                                                            t.style.boxShadow = 'none';
                                                        }}
                                                    >
                                                        {btn.label}
                                                        <LuArrowRight size={12} style={{ opacity: 0.7 }} />
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurriculumLandingPage;
