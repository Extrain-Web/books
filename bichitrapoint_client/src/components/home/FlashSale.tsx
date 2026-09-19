/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { LuZap, LuChevronRight, LuChevronLeft } from 'react-icons/lu';
import { useGetActiveOffersQuery } from '@/redux/api/offerApi';
import { useGetProductsQuery } from '@/redux/api/productApi';
import NewProductCard from '@/components/shared/NewProductCard';

/* eslint-disable @typescript-eslint/no-explicit-any */

const pad = (n: number) => String(n).padStart(2, '0');

/** Seconds left until the given end time. */
const secondsUntil = (end: Date): number =>
    Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));

const Countdown: React.FC<{ endTime: string }> = ({ endTime }) => {
    const [secs, setSecs] = useState<number | null>(null);

    useEffect(() => {
        const end = new Date(endTime);
        setSecs(secondsUntil(end));
        const t = setInterval(() => setSecs(secondsUntil(end)), 1000);
        return () => clearInterval(t);
    }, [endTime]);

    const h = secs === null ? 0 : Math.floor(secs / 3600);
    const m = secs === null ? 0 : Math.floor((secs % 3600) / 60);
    const s = secs === null ? 0 : secs % 60;

    const Box: React.FC<{ v: number }> = ({ v }) => (
        <span
            className="inline-flex items-center justify-center min-w-[24px] sm:min-w-[28px] h-6 sm:h-7 px-1 rounded text-white text-xs sm:text-sm font-extrabold tabular-nums shadow-sm"
            style={{ background: 'var(--color-primary)' }}
            suppressHydrationWarning
        >
            {pad(v)}
        </span>
    );

    return (
        <div className="flex items-center gap-1">
            <Box v={h} />
            <span className="font-extrabold text-xs sm:text-sm" style={{ color: 'var(--color-primary)' }}>:</span>
            <Box v={m} />
            <span className="font-extrabold text-xs sm:text-sm" style={{ color: 'var(--color-primary)' }}>:</span>
            <Box v={s} />
        </div>
    );
};

/**
 * Daraz-style Flash Sale row — DYNAMIC & BACKEND-DRIVEN.
 * Fetches active flash sale offer from GET /api/offers/active?type=flash-sale.
 * If no offer exists in backend DB, it dynamically falls back to top discounted products
 * with a dynamic end-of-day countdown timer. Includes left/right navigation arrow buttons.
 */
const FlashSale: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { data: offerRes, isLoading: offerLoading } = useGetActiveOffersQuery({ type: 'flash-sale' });
    const offers: any[] = offerRes?.data || [];
    const offer = offers[0];

    // 1) Active admin-configured campaign products
    const offerProducts: any[] = (offer?.products || []).filter(Boolean);

    // 2) Products explicitly marked with `isFlashSale: true`
    const { data: flashMarkedRes, isLoading: flashLoading } = useGetProductsQuery({
        limit: 20,
        isFlashSale: true,
        sort: '-discount',
    });
    const flashMarkedProducts: any[] = flashMarkedRes?.data || [];

    // Filter out products whose offerEndDate has already expired
    const now = Date.now();
    const activeFlashProducts = flashMarkedProducts.filter((p: any) => {
        if (!p.offerEndDate) return true;
        const end = new Date(p.offerEndDate).getTime();
        return isNaN(end) || end > now;
    });

    const items: any[] = (
        offerProducts.length > 0
            ? offerProducts
            : activeFlashProducts
    ).slice(0, 12);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -380 : 380;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Auto hidden: If still loading or if no products are in flash sale, hide section completely
    if (offerLoading || flashLoading) return null;
    if (items.length === 0) return null;

    // Countdown target time
    const getActiveEndTime = () => {
        if (offer?.endTime) return offer.endTime;
        const validDates = items
            .map((p) => (p.offerEndDate ? new Date(p.offerEndDate).getTime() : 0))
            .filter((t) => t > now);
        if (validDates.length > 0) {
            return new Date(Math.min(...validDates)).toISOString();
        }
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return end.toISOString();
    };

    const endTime = getActiveEndTime();

    return (
        <div className="container mx-auto px-2 sm:px-4 my-3 sm:my-5">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <h2 className="flex items-center gap-1 text-lg sm:text-xl font-extrabold text-gray-900">
                            {offer?.title || 'Flash'}
                            <LuZap size={20} style={{ color: 'var(--color-primary)', fill: 'var(--color-primary)' }} />
                        </h2>
                        <Countdown endTime={endTime} />
                    </div>

                    <Link
                        href={offer?.link || '/products?sort=-discount'}
                        className="flex items-center gap-0.5 text-xs sm:text-sm font-semibold transition-colors hover:opacity-80"
                        style={{ color: 'var(--color-primary)' }}
                    >
                        Shop More <LuChevronRight size={16} />
                    </Link>
                </div>

                {/* Horizontal scrollable row container with floating arrow buttons */}
                <div className="relative">
                    {/* Left arrow */}
                    <button
                        onClick={() => handleScroll('left')}
                        aria-label="Scroll left"
                        className="flex absolute left-0 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:bg-[var(--color-primary)] hover:text-white hover:border-white transition-all cursor-pointer"
                    >
                        <LuChevronLeft size={16} />
                    </button>

                    {/* Horizontal scrollable row */}
                    <div
                        ref={scrollRef}
                        className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth px-1"
                    >
                        {items.map((p) => (
                            <div
                                key={p._id || p.id}
                                className="flex-shrink-0 w-[155px] sm:w-[180px] md:w-[195px] lg:w-[calc((100%-80px)/6)]"
                            >
                                <NewProductCard
                                    product={{
                                        id: p._id || p.id,
                                        slug: p.slug,
                                        name: p.name,
                                        image: p.thumbnail || p.images?.[0] || '',
                                        price: p.price,
                                        originalPrice: p.originalPrice || undefined,
                                        discount: p.discount,
                                        offerStartDate: p.offerStartDate,
                                        offerEndDate: p.offerEndDate,
                                        rating: p.rating,
                                        reviews: p.reviewCount,
                                        warranty: p.tagline || p.brand || 'Lower price than others but quality higher',
                                        categoryName: p.category?.name || '',
                                        priceType: p.priceType || 'negotiable',
                                        sold: p.totalSold || p.sold || 0,
                                        likeCount: p.likeCount || 0,
                                        commentCount: p.commentCount || 0,
                                        shareCount: p.shareCount || 0,
                                        viewCount: p.viewCount || 0,
                                        reviewCount: p.reviewCount || 0,
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Right arrow */}
                    <button
                        onClick={() => handleScroll('right')}
                        aria-label="Scroll right"
                        className="flex absolute right-0 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:bg-[var(--color-primary)] hover:text-white hover:border-white transition-all cursor-pointer"
                    >
                        <LuChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlashSale;
