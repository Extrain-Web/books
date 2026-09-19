/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { LuMapPin, LuMail, LuHeadphones } from 'react-icons/lu';
import { FaFacebookF, FaWhatsapp, FaInstagram, FaYoutube, FaLinkedinIn } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { toast } from 'react-hot-toast';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import type { IconType } from 'react-icons';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const SOCIAL_CONFIG: { [key: string]: { icon: IconType; bg: string } } = {
    facebook: { icon: FaFacebookF, bg: '#3b5998' },
    whatsapp: { icon: FaWhatsapp, bg: '#25D366' },
    instagram: { icon: FaInstagram, bg: '#E1306C' },
    youtube: { icon: FaYoutube, bg: '#FF0000' },
    linkedin: { icon: FaLinkedinIn, bg: '#0077B5' },
    twitter: { icon: FaXTwitter, bg: '#1DA1F2' },
};

const NewFooter: React.FC = () => {
    const { data: siteRes } = useGetSiteContentQuery({});

    // ── Newsletter subscribe ──
    const [email, setEmail] = useState('');
    const [subscribing, setSubscribing] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = email.trim();
        if (!value) {
            toast.error('Please enter your email');
            return;
        }
        setSubscribing(true);
        try {
            const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: value }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json?.message || 'Subscription failed');
            }
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

    const address = contact.address || contact.corporateOffice || '6 Kalabagan, Bus Stand, Dhaka-1205';
    const contactEmail = contact.email || contact.emails?.[0] || 'support@bichitrapoint.com';
    const phone = contact.phone || (Array.isArray(contact.phones) && contact.phones[0]) || '09611209049';
    const whatsapp = contact.whatsapp || siteRes?.data?.floating?.whatsapp || (Array.isArray(contact.phones) && contact.phones[1]) || '01739498553';

    // WhatsApp wa.me formatted link
    const waDigits = whatsapp.replace(/\D/g, '');
    const waNumber = !waDigits ? '8801739498553' : waDigits.startsWith('880') ? waDigits : waDigits.startsWith('0') ? '88' + waDigits : '880' + waDigits;
    const whatsappLink = `https://wa.me/${waNumber}`;

    // Social links from DB or default
    const dbSocials: { label: string; url: string }[] = (contact.socials || [])
        .filter((s: any) => s?.url && s.url !== '#');

    const defaultSocials = [
        { label: 'facebook', url: 'https://www.facebook.com/BichitraPoints' },
        { label: 'whatsapp', url: whatsappLink },
    ];

    const socials = dbSocials.length > 0 ? dbSocials : defaultSocials;

    return (
        <footer style={{ background: 'var(--color-primary, #0072bc)' }} className="text-white">
            {/* ── Main Footer Grid ── */}
            <div className="container mx-auto px-4 pt-12 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

                    {/* ── Column 1: Brand & Description ── */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/Bichitra-Point-Logo.png"
                                alt="Bichitra Point"
                                className="h-[42px] md:h-[48px] w-auto object-contain"
                            />
                        </Link>
                        <p className="text-[14px] text-white/90 leading-relaxed font-normal">
                            {footer.aboutText || general.shortDescription || general.tagline || (
                                'Bichitra Point is a books and stationery retail chain, specializing in English medium textbooks, English novels, office stationery, and art & craft supplies. We deliver anywhere in Bangladesh within a maximum of 4 days.'
                            )}
                        </p>
                    </div>

                    {/* ── Column 2: Contact Info ── */}
                    <div className="space-y-3.5">
                        <h4 className="text-[16px] font-bold text-white tracking-wide">Contact Info</h4>
                        <ul className="space-y-3 text-[14px] text-white/90">
                            <li className="flex items-start gap-2.5">
                                <LuMapPin size={17} className="shrink-0 mt-0.5 text-white" />
                                <span>{address}</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <LuMail size={17} className="shrink-0 text-white" />
                                <a href={`mailto:${contactEmail}`} className="hover:underline transition-colors">
                                    {contactEmail}
                                </a>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <LuHeadphones size={17} className="shrink-0 text-white" />
                                <a href={`tel:${phone}`} className="hover:underline transition-colors">
                                    {phone}
                                </a>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <FaWhatsapp size={17} className="shrink-0 text-white" />
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:underline transition-colors">
                                    {whatsapp}
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* ── Column 3: Useful Links ── */}
                    <div className="space-y-3.5">
                        <h4 className="text-[16px] font-bold text-white tracking-wide">Useful Links</h4>
                        <ul className="space-y-2 text-[14px] text-white/90">
                            <li>
                                <Link href="/about" className="hover:text-white hover:underline transition-colors block py-0.5">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/track" className="hover:text-white hover:underline transition-colors block py-0.5">
                                    Track Your Order
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-white hover:underline transition-colors block py-0.5">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/delivery" className="hover:text-white hover:underline transition-colors block py-0.5">
                                    Delivery
                                </Link>
                            </li>
                            <li>
                                <Link href="/refund" className="hover:text-white hover:underline transition-colors block py-0.5">
                                    Return Refund Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-white hover:underline transition-colors block py-0.5">
                                    Terms &amp; Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* ── Column 4: Follow us & Subscribe ── */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[16px] font-bold text-white tracking-wide mb-2.5">Social links:</h4>
                            {/* <p className="text-[13px] font-semibold text-white/95 mt-2 mb-2.5">Social links:</p> */}

                            {/* Social round buttons */}
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
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-110 active:scale-95 transition-transform"
                                            style={{ backgroundColor: config.bg }}
                                        >
                                            <Icon size={14} />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Newsletter Subscribe Input + Button ── */}
                        <div className="pt-2">
                            <p className="text-[13px] font-semibold text-white mb-2">Subscribe:</p>
                            <form onSubmit={handleSubscribe} className="flex items-stretch gap-1.5 w-full">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    aria-label="Email address for subscription"
                                    disabled={subscribing}
                                    className="flex-1 min-w-0 bg-white text-gray-900 placeholder-gray-400 text-xs sm:text-[13px] px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60"
                                />
                                <button
                                    type="submit"
                                    disabled={subscribing}
                                    className="shrink-0 bg-white text-[var(--color-primary,#0072bc)] hover:bg-white/90 font-bold text-xs sm:text-[13px] px-3.5 py-2 rounded transition-all active:scale-95 disabled:opacity-60 shadow-sm cursor-pointer"
                                >
                                    {subscribing ? '...' : 'Subscribe'}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Bottom Copyright Bar ── */}
            <div className="border-t border-white/20">
                <div className="container mx-auto px-4 py-4 text-center">
                    <p className="text-xs sm:text-[14px] text-white/90 font-normal">
                        {footer.copyright || `${footer.companyName || general.storeName || 'Bichitra Point'} © ${new Date().getFullYear()}. All Rights Reserved.`}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default NewFooter;
