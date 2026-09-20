/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { LuMapPin, LuMail, LuHeadphones, LuChevronRight } from 'react-icons/lu';
import { FaFacebookF, FaWhatsapp, FaInstagram, FaYoutube, FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { toast } from 'react-hot-toast';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import { useGetCategoriesQuery } from '@/redux/api/categoryApi';
import type { IconType } from 'react-icons';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Shown until the admin fills contact details in Dashboard → Site Content.
const FALLBACK_PHONE = '01833389291';
const FALLBACK_EMAIL = 'sakil.dazuka@gmail.com';

const SOCIAL_CONFIG: { [key: string]: { icon: IconType; bg: string } } = {
    facebook: { icon: FaFacebookF, bg: '#3b5998' },
    whatsapp: { icon: FaWhatsapp, bg: '#25D366' },
    instagram: { icon: FaInstagram, bg: '#E1306C' },
    youtube: { icon: FaYoutube, bg: '#FF0000' },
    linkedin: { icon: FaLinkedinIn, bg: '#0077B5' },
    twitter: { icon: FaXTwitter, bg: '#111827' },
};

interface Cat { _id: string; name: string; slug: string; parent?: string | { _id: string } | null; }
const parentId = (c: Cat): string | null => !c.parent ? null : (typeof c.parent === 'object' ? c.parent?._id ?? null : c.parent);

const NewFooter: React.FC = () => {
    const { data: siteRes } = useGetSiteContentQuery({});
    const { data: catRes } = useGetCategoriesQuery(undefined);

    const [email, setEmail] = useState('');
    const [subscribing, setSubscribing] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = email.trim();
        if (!value) { toast.error('Please enter your email'); return; }
        setSubscribing(true);
        try {
            const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: value }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.message || 'Subscription failed');
            toast.success(json?.message || 'Subscribed! Thanks for joining our newsletter.');
            setEmail('');
        } catch (err: any) {
            toast.error(err?.message || 'Subscription failed. Please try again.');
        } finally {
            setSubscribing(false);
        }
    };

    const contact = siteRes?.data?.contact || {};
    const general = siteRes?.data?.general || {};
    const footer = siteRes?.data?.footer || {};

    const address = contact.address || contact.corporateOffice || 'Dhaka, Bangladesh';
    const contactEmail = contact.email || contact.emails?.[0] || FALLBACK_EMAIL;
    const phone = contact.phone || (Array.isArray(contact.phones) && contact.phones[0]) || FALLBACK_PHONE;
    const whatsapp = contact.whatsapp || siteRes?.data?.floating?.whatsapp || (Array.isArray(contact.phones) && contact.phones[1]) || FALLBACK_PHONE;

    const waDigits = whatsapp.replace(/\D/g, '');
    const waNumber = !waDigits ? '8801833389291' : waDigits.startsWith('880') ? waDigits : waDigits.startsWith('0') ? '88' + waDigits : '880' + waDigits;
    const whatsappLink = `https://wa.me/${waNumber}`;

    const storeName = general.storeName || footer.companyName || 'Books River';

    const dbSocials: { label: string; url: string }[] = (contact.socials || []).filter((s: any) => s?.url && s.url !== '#');
    const defaultSocials = [
        { label: 'facebook', url: 'https://www.facebook.com/BooksRiver' },
        { label: 'whatsapp', url: whatsappLink },
    ];
    const socials = dbSocials.length > 0 ? dbSocials : defaultSocials;

    // Dynamic shop categories (top-level only) — same source the admin manages.
    const cats: Cat[] = (catRes?.data || []).filter((c: Cat) => !parentId(c)).slice(0, 8);

    const usefulLinks = [
        { href: '/about', label: 'About Us' },
        { href: '/products', label: 'Shop All Books' },
        { href: '/quotations', label: 'Request a Book' },
        { href: '/track', label: 'Track Your Order' },
        { href: '/contact', label: 'Contact Us' },
        { href: '/refund', label: 'Return & Refund Policy' },
        { href: '/terms', label: 'Terms & Conditions' },
        { href: '/privacy', label: 'Privacy Policy' },
    ];

    const linkCls = "flex items-center gap-1.5 text-white/70 hover:text-white transition-colors py-1 group";
    const arrow = <LuChevronRight size={13} className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all shrink-0" style={{ color: 'var(--color-primary)' }} />;

    return (
        <footer style={{ background: '#16233d' }} className="text-white">
            <div className="container mx-auto px-4 pt-12 pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-9 lg:gap-8">

                    {/* ── Column 1: Brand + contact ── */}
                    <div className="space-y-4 sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-flex items-center gap-2.5">
                            <span className="bg-white rounded-full p-0.5 shadow-md">
                                <img src="/Books-River-Logo.png" alt={storeName} className="h-11 w-11 rounded-full object-cover" />
                            </span>
                            <span className="flex flex-col leading-none">
                                <span className="text-[18px] font-extrabold text-white">{storeName}</span>
                                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase mt-0.5" style={{ color: 'var(--color-primary)' }}>The Reading Journey</span>
                            </span>
                        </Link>
                        <p className="text-[13.5px] text-white/70 leading-relaxed">
                            {footer.aboutText || general.shortDescription || general.tagline ||
                                'Books River is your trusted online bookstore in Bangladesh — comics, manga, children’s books, curriculum & essential books, stationery and more, delivered nationwide.'}
                        </p>

                        <ul className="space-y-2.5 text-[13.5px] text-white/80 pt-1">
                            <li className="flex items-start gap-2.5">
                                <LuMapPin size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                                <span>{address}</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <LuHeadphones size={16} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                                <a href={`tel:${phone}`} className="hover:text-white transition-colors">{phone}</a>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <LuMail size={16} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                                <a href={`mailto:${contactEmail}`} className="hover:text-white transition-colors break-all">{contactEmail}</a>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <FaWhatsapp size={16} className="shrink-0" style={{ color: 'var(--color-primary)' }} />
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{whatsapp}</a>
                            </li>
                        </ul>
                    </div>

                    {/* ── Column 2: Useful links ── */}
                    <div>
                        <h4 className="text-[15px] font-bold text-white mb-4 relative pb-2 inline-block">
                            Quick Links                        </h4>
                        <ul className="text-[13.5px]">
                            {usefulLinks.map((l) => (
                                <li key={l.href}>
                                    <Link href={l.href} className={linkCls}>{arrow}<span>{l.label}</span></Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── Column 3: Shop by category (dynamic) ── */}
                    <div>
                        <h4 className="text-[15px] font-bold text-white mb-4 relative pb-2 inline-block">
                            Shop by Category                        </h4>
                        <ul className="text-[13.5px]">
                            {cats.length > 0 ? cats.map((c) => (
                                <li key={c._id}>
                                    <Link href={`/products?category=${c._id}`} className={linkCls}>{arrow}<span className="truncate">{c.name}</span></Link>
                                </li>
                            )) : (
                                <li><Link href="/products" className={linkCls}>{arrow}<span>All Books</span></Link></li>
                            )}
                        </ul>
                    </div>

                    {/* ── Column 4: Social + newsletter ── */}
                    <div className="space-y-5 sm:col-span-2 lg:col-span-1">
                        <div>
                            <h4 className="text-[15px] font-bold text-white mb-3 relative pb-2 inline-block">
                                Follow Us
                            </h4>
                            <div className="flex items-center gap-2.5">
                                {socials.map((s, idx) => {
                                    const key = Object.keys(SOCIAL_CONFIG).find((k) => s.label.toLowerCase().includes(k)) || 'facebook';
                                    const config = SOCIAL_CONFIG[key] || SOCIAL_CONFIG.facebook;
                                    const Icon = config.icon;
                                    return (
                                        <a
                                            key={`${s.label}-${idx}`}
                                            href={s.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={s.label}
                                            className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-110 active:scale-95 transition-transform"
                                            style={{ backgroundColor: config.bg }}
                                        >
                                            <Icon size={15} />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="text-[13.5px] font-semibold text-white mb-2">Subscribe to our newsletter</p>
                            <form onSubmit={handleSubscribe} className="flex items-stretch gap-1.5 w-full">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    aria-label="Email address for subscription"
                                    disabled={subscribing}
                                    className="flex-1 min-w-0 bg-white/10 border border-white/15 text-white placeholder-white/40 text-[13px] px-3 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-60"
                                />
                                <button
                                    type="submit"
                                    disabled={subscribing}
                                    className="shrink-0 text-white font-bold text-[13px] px-4 py-2.5 rounded-md transition-all active:scale-95 disabled:opacity-60 shadow-sm cursor-pointer hover:brightness-110"
                                    style={{ background: 'var(--color-primary)' }}
                                >
                                    {subscribing ? '...' : 'Subscribe'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom Copyright Bar ── */}
            <div className="border-t border-white/10">
                <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
                    <p className="text-xs sm:text-[13.5px] text-white/70">
                        {footer.copyright || `${storeName} © ${new Date().getFullYear()}. All Rights Reserved.`}
                    </p>
                    <p className="text-xs sm:text-[13px] text-white/50">The Reading Journey · Delivered nationwide 🇧🇩</p>
                </div>
            </div>
        </footer>
    );
};

export default NewFooter;
