/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LuShoppingCart, LuChevronDown, LuMenu, LuX,
    LuUser, LuHeart, LuLogOut, LuLayoutGrid, LuChevronRight,
} from 'react-icons/lu';
import { useAppSelector, useAppDispatch } from '@/redux';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { logout } from '@/redux/slices/authSlice';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';
import { useWishlist } from '@/hooks/useWishlist';

interface Category {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
    parent?: string | { _id: string } | null;
}

const FALLBACK_PHONE = '01833389291';
const FALLBACK_EMAIL = 'sakil.dazuka@gmail.com';
const BROWN = '#6C2E00';
const NAV_INLINE = 5;
const DEFAULT_MARQUEE =
    '📚 Books River — The Reading Journey   •   সারাদেশে হোম ডেলিভারি   •   কমিকস · মাঙ্গা · শিশুতোষ · একাডেমিক · বাংলা বই   •   ৳১৪৯৯+ অর্ডারে ফ্রি ডেলিভারি 🇧🇩';

const parentId = (c: Category): string | null =>
    !c.parent ? null : (typeof c.parent === 'object' ? c.parent?._id ?? null : c.parent);

const Header: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const moreRef = useRef<HTMLLIElement>(null);

    const cartItems = useAppSelector((state) => state.cart.items);
    const { count: wishlistCount } = useWishlist();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();

    const wishlistHref = '/wishlist';

    // menu:true → only categories the admin toggled "Show in Menu" appear in the nav.
    const { data: categoriesData } = useGetCategoriesQuery({ menu: true });
    const categories: Category[] = categoriesData?.data || [];
    const topCategories = categories.filter((c) => !parentId(c));
    const childrenOf = (id: string) => categories.filter((c) => parentId(c) === id);
    const inlineCats = topCategories.slice(0, NAV_INLINE);
    const moreCats = topCategories.slice(NAV_INLINE);

    const { data: siteContentRes } = useGetSiteContentQuery(undefined);
    const contact = siteContentRes?.data?.contact || {};
    const general = siteContentRes?.data?.general || {};
    const contactPhone: string = contact.phone || FALLBACK_PHONE;
    const contactEmail: string = contact.email || FALLBACK_EMAIL;
    // Marquee text — from the admin's Site Content ticker, else a sensible default.
    const tickerItems = ((siteContentRes?.data?.ticker || []) as Array<{ text?: string; emoji?: string; active?: boolean; order?: number }>)
        .filter((t) => t?.text && t.active !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const marqueeText = tickerItems.length
        ? tickerItems.map((t) => `${t.emoji ? t.emoji + ' ' : ''}${t.text}`).join('   •   ')
        : (general.tagline ? `${general.tagline}   •   ${DEFAULT_MARQUEE}` : DEFAULT_MARQUEE);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) setIsMoreOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsProfileOpen(false);
        router.push('/');
    };

    const handleGoHome = () => setSearchQuery('');

    const handleSearch = (rawTerm?: string) => {
        const trimmed = (rawTerm ?? searchQuery).trim();
        if (!trimmed) return;
        router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    };

    const iconBtn = "relative flex items-center justify-center w-9 h-9 rounded-full text-slate-700 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lightest)] transition-colors cursor-pointer";
    const badgeCls = "absolute -top-1 -right-1 text-[9px] min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white";
    const navLink = "flex items-center gap-0.5 h-full px-2.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors";

    // Nav item with People-Choice-style MEGA-MENU dropdown for its sub-categories.
    const NavItem = ({ cat, align = 'left' }: { cat: Category; align?: 'left' | 'right' }) => {
        const kids = childrenOf(cat._id);
        const cols = kids.length > 8 ? 3 : kids.length > 4 ? 2 : 1;
        const panelW = cols === 3 ? 'w-[600px]' : cols === 2 ? 'w-[440px]' : 'w-[300px]';
        return (
            <li className="relative group h-full flex items-center">
                <Link href={`/products?category=${cat._id}`} className={navLink} style={{ color: '#333' }}>
                    <span className="group-hover:text-[var(--color-primary)] transition-colors">{cat.name}</span>
                    {kids.length > 0 && <LuChevronDown size={13} className="opacity-60 group-hover:text-[var(--color-primary)] group-hover:rotate-180 transition-all" />}
                </Link>
                {kids.length > 0 && (
                    <div
                        className={`invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} z-[60] ${panelW} max-w-[92vw] bg-white rounded-b-xl shadow-2xl shadow-black/15 border border-gray-100 border-t-2 overflow-hidden`}
                        style={{ borderTopColor: 'var(--color-primary)' }}
                    >
                        <div className="flex">
                            {/* sub-category columns */}
                            <div className={`flex-1 p-4 grid gap-x-4 gap-y-0.5 ${cols === 3 ? 'grid-cols-3' : cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {kids.map((kid) => (
                                    <Link
                                        key={kid._id}
                                        href={`/products?category=${kid._id}`}
                                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] text-slate-600 hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)] transition-colors"
                                    >
                                        <LuChevronRight size={12} className="opacity-40 shrink-0" />
                                        <span className="truncate">{kid.name}</span>
                                    </Link>
                                ))}
                            </div>
                            {/* promo card (People-Choice style) — only on wider panels */}
                            {cols >= 2 && (
                                <div className="w-[190px] shrink-0 m-3 rounded-xl p-4 flex flex-col justify-between text-white" style={{ background: 'linear-gradient(160deg,#2a1a12,#6C2E00)' }}>
                                    <div>
                                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2" style={{ background: 'var(--color-primary)', color: '#fff' }}>Featured</span>
                                        <p className="text-[15px] font-extrabold leading-tight">{cat.name}</p>
                                        <p className="text-[11px] text-white/70 mt-1 leading-snug">সেরা কালেকশন — এখনই দেখুন।</p>
                                    </div>
                                    <Link href={`/products?category=${cat._id}`} className="mt-3 inline-flex items-center justify-center gap-1 text-[12px] font-bold rounded-lg px-3 py-2 text-white hover:brightness-110 transition-all" style={{ background: 'var(--color-primary)' }}>
                                        Shop {cat.name} <span aria-hidden>→</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </li>
        );
    };

    return (
        <>
            {/* ════════════════ TOP BAR — brown ════════════════ */}
            <div className="hidden md:block text-white text-[13px]" style={{ background: BROWN }}>
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-9">
                        <div className="flex items-center h-9 divide-x divide-white/20">
                            <a href={`tel:${contactPhone}`} className="pr-4 hover:text-white/80 transition-colors">{contactPhone}</a>
                            <a href={`mailto:${contactEmail}`} className="px-4 hover:text-white/80 transition-colors">{contactEmail}</a>
                        </div>
                        {/* Marquee — scrolls right → left (dynamic from admin ticker) */}
                        <div className="hidden lg:flex flex-1 min-w-0 overflow-hidden px-6 marquee-track">
                            <div className="flex shrink-0 animate-marquee will-change-transform">
                                <span className="whitespace-nowrap font-normal text-white/90 pr-20">{marqueeText}</span>
                                <span className="whitespace-nowrap font-normal text-white/90 pr-20" aria-hidden="true">{marqueeText}</span>
                            </div>
                        </div>
                        <div className="flex items-center h-9 divide-x divide-white/20">
                            <Link href="/track" className="px-4 font-medium hover:text-white/80 transition-colors">Track Order</Link>
                            <Link href="/quotations" className="pl-4 font-medium hover:text-white/80 transition-colors">Book Request</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════ MAIN HEADER — white ════════════════ */}
            <header
                className="sticky top-0 z-50 w-full bg-white"
                style={{
                    transition: 'box-shadow 0.25s ease',
                    boxShadow: scrolled ? '0 6px 20px -6px rgba(15,23,42,0.18)' : '0 1px 0 rgba(15,23,42,0.06)',
                }}
            >
                <div className="container mx-auto px-3 sm:px-4">
                    <div className="flex items-center gap-2 lg:gap-4 h-[62px] lg:h-[82px]">

                        {/* Menu button — first on mobile so the logo can sit centred */}
                        <button
                            className="lg:hidden shrink-0 -ml-1 p-2 text-slate-700 hover:text-[var(--color-primary)] rounded-md hover:bg-[var(--color-primary-lightest)] transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <LuX size={24} /> : <LuMenu size={24} />}
                        </button>

                        {/* Logo — centred on mobile, flush left from lg up */}
                        <div className="flex-1 min-w-0 flex justify-center lg:flex-none lg:justify-start">
                            <Link href="/" className="min-w-0 shrink" onClick={handleGoHome} aria-label={general.storeName || 'Books River — home'}>
                                <HeaderLogo storeName={general.storeName} />
                            </Link>
                        </div>

                        {/* Inline nav (desktop) */}
                        <nav className="hidden lg:flex items-center h-full shrink-0">
                            <ul className="flex items-center h-full">
                                {inlineCats.map((cat, idx) => <NavItem key={cat._id} cat={cat} align={idx >= inlineCats.length / 2 ? 'right' : 'left'} />)}
                                {moreCats.length > 0 && (
                                    <li className="relative group h-full flex items-center" ref={moreRef}>
                                        <button onClick={() => setIsMoreOpen(v => !v)} className={navLink} style={{ color: '#333' }}>
                                            More <LuChevronDown size={13} className={`opacity-60 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isMoreOpen && (
                                            <div className="absolute top-full right-0 z-[60] w-[240px] bg-white rounded-b-xl shadow-2xl shadow-black/15 border border-gray-100 border-t-2 py-2" style={{ borderTopColor: 'var(--color-primary)' }}>
                                                {moreCats.map((cat) => (
                                                    <Link key={cat._id} href={`/products?category=${cat._id}`} onClick={() => setIsMoreOpen(false)} className="flex items-center justify-between gap-2 px-4 py-2 text-[13.5px] text-slate-600 hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)] transition-colors">
                                                        <span className="truncate">{cat.name}</span>
                                                        <LuChevronRight size={13} className="opacity-40 shrink-0" />
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </li>
                                )}
                            </ul>
                        </nav>

                        {/* Search — wide box, hugs the right, People-Choice style */}
                        <div className="hidden md:flex flex-1 min-w-0 justify-end">
                            <div className="w-full max-w-[260px] lg:max-w-[360px] xl:max-w-[460px]">
                                <SearchAutocomplete
                                    variant="desktop"
                                    simple
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    onSubmit={(term) => handleSearch(term)}
                                    placeholder="Search for books…"
                                />
                            </div>
                        </div>

                        {/* Right icons */}
                        <div className="flex items-center shrink-0 gap-0.5 ml-1 lg:ml-2">
                            {isAuthenticated && user ? (
                                <div className="relative" ref={profileRef}>
                                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={iconBtn} aria-label="Account">
                                        {user.avatar ? <img src={user.avatar} alt="" className="w-[24px] h-[24px] rounded-full object-cover ring-1 ring-gray-200" /> : <LuUser size={21} strokeWidth={1.7} />}
                                    </button>
                                    {isProfileOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-md shadow-2xl shadow-gray-900/12 border border-gray-100 overflow-hidden z-50">
                                            <div className="px-4 py-3.5 border-b border-gray-100" style={{ background: 'var(--color-primary-lightest)' }}>
                                                <p className="text-sm font-bold text-gray-800 truncate">{user.name || 'User'}</p>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                                            </div>
                                            <div className="py-1.5">
                                                {[
                                                    { href: (user.role === 'admin' || user.role === 'superadmin') ? '/dashboard/admin' : '/dashboard/user', icon: <LuLayoutGrid size={15} />, label: 'Dashboard' },
                                                    { href: wishlistHref, icon: <LuHeart size={15} />, label: 'Wishlist' },
                                                ].map(item => (
                                                    <Link key={item.href} href={item.href} onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)] transition-colors">{item.icon} {item.label}</Link>
                                                ))}
                                            </div>
                                            <div className="border-t border-gray-100 py-1.5">
                                                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"><LuLogOut size={15} /> Logout</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link href="/login" className={`flex ${iconBtn}`} aria-label="Sign In"><LuUser size={21} strokeWidth={1.7} /></Link>
                            )}

                            <Link href={wishlistHref} className={`hidden lg:flex ${iconBtn}`} aria-label="Wishlist">
                                <LuHeart size={21} strokeWidth={1.7} />
                                {wishlistCount > 0 && <span className={badgeCls} style={{ background: 'var(--color-primary)' }}>{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
                            </Link>

                            <Link href="/cart" className={iconBtn} aria-label="Cart">
                                <LuShoppingCart size={21} strokeWidth={1.7} />
                                {cartItems.length > 0 && <span className={badgeCls} style={{ background: 'var(--color-primary)' }}>{cartItems.length > 99 ? '99+' : cartItems.length}</span>}
                            </Link>

                        </div>
                    </div>

                    {/* Mobile search */}
                    <div className="md:hidden pb-3">
                        <SearchAutocomplete variant="mobile" value={searchQuery} onChange={setSearchQuery} onSubmit={(term) => handleSearch(term)} placeholder="Search books…" />
                    </div>

                    {/* Mobile menu */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden bg-white rounded-xl border border-gray-100 shadow-lg mt-1 mb-3 py-2">
                            <div className="space-y-0.5">
                                <button onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)} className="w-full flex items-center justify-between px-3 py-2.5 text-gray-800 font-semibold text-sm rounded-md hover:bg-gray-50">
                                    <span>Categories</span>
                                    <LuChevronDown size={14} className={`transition-transform ${isMobileCategoryOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isMobileCategoryOpen && (
                                    <div className="pl-3 space-y-0.5">
                                        <Link href="/products" className="block px-3 py-2 text-gray-600 text-sm rounded-md hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)]" onClick={() => setIsMobileMenuOpen(false)}>📚 All Books</Link>
                                        {topCategories.map(cat => (
                                            <Link key={cat._id} href={`/products?category=${cat._id}`} className="flex items-center gap-2 px-3 py-2 text-gray-600 text-sm rounded-md hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary)]" onClick={() => setIsMobileMenuOpen(false)}>
                                                {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/') || cat.icon.startsWith('data:') ? <img src={cat.icon} alt="" className="w-4 h-4 object-contain rounded shrink-0" /> : <span className="text-sm">{cat.icon}</span>)}
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                {[
                                    { href: '/track', label: '📦 Track Order' },
                                    { href: '/quotations', label: '📖 Book Request' },
                                    { href: '/contact', label: '💬 Help & Support' },
                                    { href: wishlistHref, label: '♥ Wishlist' },
                                ].map(item => (
                                    <Link key={item.href} href={item.href} className="block px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-lightest)] rounded-md" onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
};

function HeaderLogo({ storeName }: { storeName?: string }) {
    // Mobile: compact icon with the name stacked underneath. lg+: icon beside the name.
    return (
        <div className="group flex flex-col lg:flex-row items-center gap-0.5 lg:gap-2 min-w-0 select-none" aria-label={storeName || 'Books River'}>
            <img
                src="/Books-River-Logo.png"
                alt={storeName || 'Books River'}
                draggable={false}
                className="h-[30px] w-[30px] lg:h-[52px] lg:w-[52px] shrink-0 rounded-full object-cover shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col leading-none min-w-0 items-center lg:items-start">
                <span className="text-[12px] lg:text-[20px] font-extrabold tracking-tight truncate" style={{ color: '#1b2a4a' }}>{storeName || 'Books River'}</span>
                <span className="hidden lg:block text-[10px] font-semibold tracking-[0.16em] uppercase mt-0.5 truncate" style={{ color: 'var(--color-primary)' }}>The Reading Journey</span>
            </div>
        </div>
    );
}

export default Header;
