/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import NewProductCard from '@/components/shared/NewProductCard';
import { useGetProductsQuery } from '@/redux/api/productApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { LuX, LuSearch, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import HeroSection from './HeroSection';
import PromoBanner from './PromoBanner';
import CollectionBanners from './CollectionBanners';
import CategoryExpertise from './CategoryExpertise';
import CtaBanner from './CtaBanner';
import FlashSale from './FlashSale';
import DealsRow from './DealsRow';
import BestSellers from './BestSellers';
import SectionHeader from './SectionHeader';
import CategoryProductRow from './CategoryProductRow';

const LIMIT = 20;

const NewHomePage: React.FC = () => {
    const searchParams = useSearchParams();

    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('searchTerm') || '');
    const [page, setPage] = useState(1);
    const [accumulatedProducts, setAccumulatedProducts] = useState<any[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const popularScrollRef = useRef<HTMLDivElement>(null);
    const newArrivalsScrollRef = useRef<HTMLDivElement>(null);

    // Dynamic Category Rows configured via Admin Dashboard (Site Content)
    const { data: siteContentRes } = useGetSiteContentQuery({});
    const dynamicCategoryRows = useMemo(() => {
        const rows = siteContentRes?.data?.categoryRows;
        if (Array.isArray(rows) && rows.length > 0) {
            return [...rows]
                .filter((r: any) => r.active !== false)
                .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        }
        return [
            { categoryName: 'Comic Books', categorySlug: 'comic-books' },
            { categoryName: 'Manga Books', categorySlug: 'manga-books' },
            { categoryName: 'Children’s Books', categorySlug: 'childrens-books' },
            { categoryName: 'Essential Books', categorySlug: 'essential-books' },
            { categoryName: 'Bangla Books', categorySlug: 'bangla-books' },
            { categoryName: 'Ladybird Books', categorySlug: 'ladybird-books' },
            { categoryName: 'Stationery', categorySlug: 'stationery' },
        ];
    }, [siteContentRes?.data?.categoryRows]);

    const handleSectionScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = direction === 'left' ? -380 : 380;
            ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const cat = searchParams.get('category') || '';
        const search = searchParams.get('searchTerm') || '';
        setSelectedCategory(cat);
        setSearchTerm(search);
        setPage(1);
        setAccumulatedProducts([]);
    }, [searchParams]);

    // Memoized so the query arg stays referentially stable across renders (Next 16
    // client components otherwise churn object identity, which can break RTK
    // Query's refetch-on-arg-change).
    const queryParams = useMemo(() => {
        const p: Record<string, string | number | undefined> = { limit: LIMIT, page, sort: '-createdAt' };
        if (selectedCategory) p.category = selectedCategory;
        if (searchTerm) p.searchTerm = searchTerm;
        return p;
    }, [page, selectedCategory, searchTerm]);

    const { data: productsData, isLoading, isFetching } = useGetProductsQuery(queryParams);

    // Popular Products: products where admin enabled "Featured Product" (isFeatured: true)
    const popularQueryParams = useMemo(() => {
        const p: Record<string, string | number | boolean | undefined> = {
            limit: 12,
            isFeatured: true,
            sort: '-createdAt',
        };
        if (selectedCategory) p.category = selectedCategory;
        if (searchTerm) p.searchTerm = searchTerm;
        return p;
    }, [selectedCategory, searchTerm]);

    const { data: popularData, isFetching: isPopularFetching } = useGetProductsQuery(popularQueryParams);
    const popularProducts = popularData?.data || [];

    // New Arrivals: products where admin enabled "New Arrival" (isNewProduct: true)
    const newArrivalsQueryParams = useMemo(() => {
        const p: Record<string, string | number | boolean | undefined> = {
            limit: 12,
            isNewProduct: true,
            sort: '-createdAt,-updatedAt',
        };
        if (selectedCategory) p.category = selectedCategory;
        if (searchTerm) p.searchTerm = searchTerm;
        return p;
    }, [selectedCategory, searchTerm]);

    const { data: newArrivalsData, isFetching: isNewArrivalsFetching } = useGetProductsQuery(newArrivalsQueryParams);
    const newArrivalsProducts = newArrivalsData?.data || [];
    // Only categories the admin has toggled to show on the homepage.
    const { data: categoriesData } = useGetCategoriesQuery({ home: true });

    const products = productsData?.data || [];
    const meta = productsData?.meta;
    // const totalPages = meta?.totalPages || 1;
    const categories = categoriesData?.data || [];

    // Signal the preloader once both products and categories are available
    useEffect(() => {
        const productsReady = !isLoading && !isFetching && !!productsData;
        const categoriesReady = !!categoriesData;
        if (productsReady && categoriesReady) {
            window.dispatchEvent(new CustomEvent('booksriver:dataReady'));
        }
    }, [isLoading, isFetching, productsData, categoriesData]);

    // Accumulate products when new data arrives
    useEffect(() => {
        if (products.length > 0 && !isFetching) {
            if (page === 1) {
                setAccumulatedProducts(products);
            } else {
                setAccumulatedProducts(prev => {
                    const existingIds = new Set(prev.map((p: any) => p._id));
                    const newProducts = products.filter((p: any) => !existingIds.has(p._id));
                    return [...prev, ...newProducts];
                });
            }
            setIsLoadingMore(false);
        }
    }, [products, isFetching, page]);

    const handleClearTextSearch = () => {
        setSearchTerm('');
        setPage(1);
        setAccumulatedProducts([]);
        window.history.pushState({}, '', '/');
    };

    const handleCategoryChange = (categoryId: string) => {
        if (categoryId === selectedCategory) {
            if (products.length > 0) setAccumulatedProducts(products);
            return;
        }
        const params = new URLSearchParams();
        if (categoryId) params.set('category', categoryId);
        window.history.pushState({}, '', `/?${params.toString()}`);
        setSelectedCategory(categoryId);
        setPage(1);
        setAccumulatedProducts([]);
    };

    // const handleLoadMore = () => {
    //     if (page < totalPages) {
    //         setIsLoadingMore(true);
    //         setPage(prev => prev + 1);
    //     }
    // };

    const displayProducts = useMemo(() => {
        return accumulatedProducts.length > 0 ? accumulatedProducts : products;
    }, [accumulatedProducts, products]);

    const selectedCategoryName = useMemo(() => {
        if (!selectedCategory) return '';
        const cat = categories.find((c: any) => c._id === selectedCategory);
        return cat?.name || '';
    }, [selectedCategory, categories]);

    // The page shell (hero, trust strip, categories, product grid) always
    // renders — it no longer blanks the entire page behind the products query.
    return (
        <>
        <div
            className="min-h-screen"
            style={{
                background: 'radial-gradient(55% 45% at 88% 0%, rgba(var(--color-primary-rgb),0.06), transparent 70%),' +
                    'radial-gradient(45% 40% at 0% 22%, rgba(var(--color-primary-rgb),0.04), transparent 70%),' +
                    '#F8FAFC',
            }}
        >
            <HeroSection />
            <CategoryExpertise />
            <CollectionBanners />
            {!searchTerm && !selectedCategory && (
                <>
                    <FlashSale />
                    <DealsRow />
                    <BestSellers />
                </>
            )}

            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">

                {/* Text Search Results Banner */}
                {searchTerm && (
                    <div className="mb-4 sm:mb-6 bg-white border border-gray-200 rounded-md p-3 sm:p-5 shadow-sm animate-fadeIn">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-lightest)' }}>
                                    <LuSearch style={{ color: 'var(--color-primary)' }} size={15} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm sm:text-base font-bold text-gray-800 truncate">
                                        Results for &quot;<span style={{ color: 'var(--color-primary)' }}>{searchTerm}</span>&quot;
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Found <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{meta?.total || displayProducts.length}</span> products
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClearTextSearch}
                                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-md text-xs font-semibold transition-colors flex-shrink-0"
                            >
                                <LuX size={12} />
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Selected Category Title */}
                {selectedCategory && (
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div>
                            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">{selectedCategoryName || 'Category'}</h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Showing all products in this category</p>
                        </div>
                        <button
                            onClick={() => handleCategoryChange('')}
                            className="text-xs sm:text-sm font-medium hover:underline flex-shrink-0 ml-2"
                            style={{ color: 'var(--color-primary)' }}
                        >
                            View all →
                        </button>
                    </div>
                )}

                {/* Search / Category Filtered Products Grid (active when searching or browsing category) */}
                {(searchTerm || selectedCategory) && displayProducts.length > 0 && (
                    <div className="mb-6 mt-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                            {displayProducts.map((product: any) => (
                                <NewProductCard
                                    key={`search-${product._id}`}
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
                            ))}
                        </div>
                    </div>
                )}

                {/* Popular Products — products flagged with isFeatured: true by admin */}
                {(isPopularFetching || popularProducts.length > 0) && (
                    <div className="mb-4 sm:mb-5 mt-4 sm:mt-6">
                        <SectionHeader
                            title="Popular Products"
                            seeMoreHref="/products?isFeatured=true"
                        />

                        <div className="relative">
                            {/* Left Arrow Button */}
                            <button
                                onClick={() => handleSectionScroll(popularScrollRef, 'left')}
                                aria-label="Scroll left"
                                className="flex absolute left-0 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:bg-[var(--color-primary)] hover:text-white hover:border-white transition-all cursor-pointer"
                            >
                                <LuChevronLeft size={16} />
                            </button>

                            {/* Scrollable Row */}
                            <div
                                ref={popularScrollRef}
                                className={`flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth px-1 transition-opacity duration-200 ${isPopularFetching ? 'opacity-60' : 'opacity-100'}`}
                            >
                                {popularProducts.slice(0, 12).map((product: any) => (
                                    <div key={`pop-${product._id}`} className="flex-shrink-0 w-[155px] sm:w-[180px] md:w-[195px] lg:w-[calc((100%-80px)/6)]">
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
                                            }} />
                                    </div>
                                ))}
                            </div>

                            {/* Right Arrow Button */}
                            <button
                                onClick={() => handleSectionScroll(popularScrollRef, 'right')}
                                aria-label="Scroll right"
                                className="flex absolute right-0 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:bg-[var(--color-primary)] hover:text-white hover:border-white transition-all cursor-pointer"
                            >
                                <LuChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mid-page promo banner — admin-managed, sits between Popular and New Arrivals */}
            <PromoBanner />

            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
                {/* New Arrivals — products flagged with isNewProduct: true by admin */}
                {(isNewArrivalsFetching || newArrivalsProducts.length > 0) && (
                    <div className="mb-4 sm:mb-5 mt-4 sm:mt-6">
                        <SectionHeader
                            title="New Arrivals"
                            seeMoreHref="/products?isNewProduct=true"
                        />

                        <div className="relative">
                            {/* Left Arrow Button */}
                            <button
                                onClick={() => handleSectionScroll(newArrivalsScrollRef, 'left')}
                                aria-label="Scroll left"
                                className="flex absolute left-0 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:bg-[var(--color-primary)] hover:text-white hover:border-white transition-all cursor-pointer"
                            >
                                <LuChevronLeft size={16} />
                            </button>

                            {/* Scrollable Row */}
                            <div
                                ref={newArrivalsScrollRef}
                                className={`flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth px-1 transition-opacity duration-200 ${isNewArrivalsFetching ? 'opacity-60' : 'opacity-100'}`}
                            >
                                {newArrivalsProducts.slice(0, 12).map((product: any) => (
                                    <div key={`new-${product._id}`} className="flex-shrink-0 w-[155px] sm:w-[180px] md:w-[195px] lg:w-[calc((100%-80px)/6)]">
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
                                            }} />
                                    </div>
                                ))}
                            </div>

                            {/* Right Arrow Button */}
                            <button
                                onClick={() => handleSectionScroll(newArrivalsScrollRef, 'right')}
                                aria-label="Scroll right"
                                className="flex absolute right-0 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-400 hover:bg-[var(--color-primary)] hover:text-white hover:border-white transition-all cursor-pointer"
                            >
                                <LuChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* <div className="mt-6 flex justify-center">
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-300"
                    >
                        View All Products <span aria-hidden>→</span>
                    </Link>
                </div> */}
            </div>

            {/* Dynamic Category-Filtered Product Rows — Managed via Admin Dashboard */}
            {dynamicCategoryRows.map((row: any) => (
                <CategoryProductRow
                    key={row._id || row.categorySlug}
                    categoryName={row.categoryName}
                    categorySlug={row.categorySlug}
                    subtitle={row.subtitle}
                />
            ))}

            {/* Empty State */}
            {!isFetching && displayProducts.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
                    <p className="text-gray-500 mb-6">Try browsing another category</p>
                    <button
                        onClick={() => handleCategoryChange('')}
                        className="px-8 py-3 text-white rounded-full font-semibold transition-colors"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        View All Products
                    </button>
                </div>
            )}

            {/* See More Products */}
            {/* {page < totalPages && displayProducts.length > 0 && (
                <div className="mt-10 flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore || isFetching}
                        className="group relative px-10 py-3.5 text-white rounded-full font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
                        style={{ background: 'var(--color-primary)' }}
                    >
                        <div className="absolute top-0 left-0 w-full h-full">
                            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:left-full transition-all duration-700 ease-in-out" />
                        </div>
                        <span className="relative z-10 flex items-center gap-2">
                            {isLoadingMore || isFetching ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <LuSearch size={16} />
                                    See More Products
                                </>
                            )}
                        </span>
                    </button>
                </div>
            )} */}

            {/* Loading more skeleton */}
            {isLoadingMore && (
                <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={`skeleton-${i}`} className="bg-white border border-gray-200 rounded-md overflow-hidden animate-pulse">
                            <div className="aspect-[4/5] bg-gray-200" />
                            <div className="p-4 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div><CtaBanner /></>
    );
};

export default NewHomePage;
