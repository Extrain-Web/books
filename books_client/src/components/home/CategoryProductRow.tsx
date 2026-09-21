"use client";

import React, { useRef } from 'react';
import { useGetProductsQuery } from '@/redux/api/productApi';
import SectionHeader from './SectionHeader';
import NewProductCard from '@/components/shared/NewProductCard';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import ProductSkeleton from '@/components/shared/ProductSkeleton';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CategoryProductRowProps {
    categoryName: string;
    categorySlug: string;
    subtitle?: string;
}

/**
 * Category-filtered homepage product row — styled like New Arrivals.
 * Displays products matching a specific category slug.
 * Hides automatically if no products exist for this category.
 * Shows exactly 5 cards per view on lg (desktop) screens.
 */
const CategoryProductRow: React.FC<CategoryProductRowProps> = ({
    categoryName,
    categorySlug,
    subtitle,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: res, isLoading } = useGetProductsQuery({
        category: categorySlug,
        limit: 12,
    });

    const products: any[] = res?.data || [];

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -380 : 380;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // If no products match this category filter, hide the section completely
    if (!isLoading && products.length === 0) {
        return null;
    }

    return (
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <div className="mb-4 sm:mb-5">
                <SectionHeader
                    title={categoryName}
                    subtitle={subtitle}
                    seeMoreHref={`/products?category=${categorySlug}`}
                />
            </div>

            <div className="relative">
                {/* Left Arrow Button */}
                <button
                    onClick={() => handleScroll('left')}
                    aria-label="Scroll left"
                    className="flex absolute left-0 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:bg-[var(--color-primary)] hover:text-white hover:border-white transition-all cursor-pointer"
                >
                    <LuChevronLeft size={16} />
                </button>

                {/* Scrollable Products Row — Exactly 6 cards on lg screens */}
                <div
                    ref={scrollRef}
                    className={`flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth px-1 transition-opacity duration-200 ${isLoading ? 'opacity-60' : 'opacity-100'}`}
                >
                    {isLoading && products.length === 0 ? (
                        [...Array(6)].map((_, i) => (
                            <div key={`cat-skel-${i}`} className="flex-shrink-0 w-[155px] sm:w-[180px] md:w-[195px] lg:w-[calc((100%-80px)/6)] h-[280px]">
                                <ProductSkeleton />
                            </div>
                        ))
                    ) : (
                        products.map((product) => (
                            <div
                                key={product._id}
                                className="flex-shrink-0 w-[155px] sm:w-[180px] md:w-[195px] lg:w-[calc((100%-80px)/6)]"
                            >
                                <NewProductCard
                                    product={{
                                        id: product._id,
                                        slug: product.slug,
                                        name: product.name,
                                        image: product.thumbnail || product.images?.[0] || '',
                                        price: product.price,
                                        originalPrice: product.originalPrice || undefined,
                                        discount: product.discount,
                                        rating: product.rating,
                                        reviews: product.reviewCount,
                                        warranty: product.tagline || product.brand || 'Lower price than others but quality higher',
                                        categoryName: product.category?.name || categoryName,
                                        priceType: product.priceType || 'negotiable',
                                        sold: product.totalSold || 0,
                                        likeCount: product.likeCount || 0,
                                        commentCount: product.commentCount || 0,
                                        shareCount: product.shareCount || 0,
                                        viewCount: product.viewCount || 0,
                                        reviewCount: product.reviewCount || 0,
                                    }}
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* Right Arrow Button */}
                <button
                    onClick={() => handleScroll('right')}
                    aria-label="Scroll right"
                    className="flex absolute right-0 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:bg-[var(--color-primary)] hover:text-white hover:border-white transition-all cursor-pointer"
                >
                    <LuChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default CategoryProductRow;
