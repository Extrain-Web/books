"use client";

import React from 'react';
import Link from 'next/link';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Homepage Collection Banners — a set of promo banner cards shown right after
 * the "Shop By Category" section (typically two side-by-side, People-Choice
 * O-Level / A-Level style).
 *
 * Fully driven by the database (Dashboard → Site Content → 🎞️ Banners):
 * upload an image per card, optionally add a headline / sub-text / button and a
 * link. Only the image is required — a card with no text just shows the artwork.
 * No banners (or all inactive) → the whole section disappears, no empty gap.
 */
const CollectionBanners: React.FC = () => {
    const { data } = useGetSiteContentQuery(undefined);

    const banners = ((data?.data?.collectionBanners || []) as any[])
        .filter((b) => b?.imageUrl && b.active !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (banners.length === 0) return null;

    // 1 banner → full width; 2+ → two per row on md and up.
    const cols = banners.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2';

    return (
        <section className="w-full" aria-label="Featured collections">
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
                <div className={`grid ${cols} gap-3 sm:gap-5`}>
                    {banners.map((b, i) => {
                        const hasText = !!(b.title || b.subtitle || b.ctaLabel);
                        return (
                            <Link
                                key={i}
                                href={b.link || '/products'}
                                aria-label={b.title || 'Explore collection'}
                                className="relative block w-full overflow-hidden rounded-[10px] border border-gray-200 bg-slate-100 aspect-[16/9]"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={b.imageUrl}
                                    alt={b.title || ''}
                                    draggable={false}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />

                                {hasText && (
                                    <>
                                        {/* left-to-right scrim so overlay text stays readable */}
                                        <div
                                            className="pointer-events-none absolute inset-0"
                                            style={{
                                                background:
                                                    'linear-gradient(to right, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.45) 40%, rgba(15,23,42,0) 72%)',
                                            }}
                                        />
                                        <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 max-w-[70%]">
                                            {b.title && (
                                                <h3 className="text-white font-extrabold leading-tight tracking-tight text-[18px] sm:text-[24px] md:text-[30px] drop-shadow">
                                                    {b.title}
                                                </h3>
                                            )}
                                            {b.subtitle && (
                                                <p className="mt-1 text-white/85 text-[11px] sm:text-[13px] md:text-[14px] leading-snug max-w-md">
                                                    {b.subtitle}
                                                </p>
                                            )}
                                            {b.ctaLabel && (
                                                <span
                                                    className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-[11px] sm:text-[13px] font-bold text-white shadow-lg"
                                                    style={{ background: 'var(--color-primary)' }}
                                                >
                                                    {b.ctaLabel} <span aria-hidden>→</span>
                                                </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default CollectionBanners;
