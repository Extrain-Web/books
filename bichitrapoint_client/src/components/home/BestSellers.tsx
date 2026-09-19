"use client";

import React, { useRef } from 'react';
import { useGetProductsQuery } from '@/redux/api/productApi';
import SectionHeader from './SectionHeader';
import NewProductCard from '@/components/shared/NewProductCard';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Number of top selling products to display */
const TOP_SELLING_COUNT = 10;

/** Sorting criteria for top sellers */
const TOP_SELLING_SORT = '-totalSold,-viewCount,-createdAt';

const BestSellers: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { data: pickedData, isLoading } = useGetProductsQuery({
        isBestSelling: true,
        limit: TOP_SELLING_COUNT,
        sort: TOP_SELLING_SORT,
    });
    const products: any[] = (pickedData?.data || []).slice(0, TOP_SELLING_COUNT);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -380 : 380;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!isLoading && products.length === 0) return null;

    return (
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <div className="mb-4 sm:mb-5">
                <SectionHeader
                    title="Top Selling Products"
                    seeMoreHref="/products?isBestSelling=true"
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

                {/* Scrollable Products Row */}
                <div
                    ref={scrollRef}
                    className="flex gap-2 sm:gap-4 overflow-x-auto pb-1.5 scrollbar-hide scroll-smooth px-1"
                >
                    {products.map((product) => (
                        <div key={product._id} className="flex-shrink-0 w-[155px] sm:w-[180px] md:w-[195px] lg:w-[calc((100%-80px)/6)]">
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
                                    categoryName: product.category?.name || '',
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
                    ))}
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

export default BestSellers;
