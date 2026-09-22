/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LuChevronLeft, LuChevronRight, LuSearch, LuGlobe } from 'react-icons/lu';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';

const SLIDE_INTERVAL = 6000; // ms per slide
const FADE_MS = 800;         // crossfade duration

type HeroSlide = {
    imageUrl: string;
    active?: boolean;
    order?: number;
    title?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    align?: 'left' | 'center' | 'right';
    textTone?: 'light' | 'dark';
    /** Soft brand-tinted gradient behind the copy. On by default — turn it off
     *  only when the artwork is already dark enough on the text side. */
    scrim?: boolean;
};

/**
 * Hero — the homepage banner carousel.
 *
 * Shows the admin's hero banners (Dashboard → Site Content → Hero Slides,
 * recommended 1920 × 540) with an OPTIONAL live-text overlay per slide.
 *
 * Text is real HTML rather than pixels baked into the artwork, so it stays
 * sharp at any resolution, shrinks sensibly on phones, renders Bengali
 * correctly and can be reworded without regenerating the image. A slide whose
 * artwork already carries its own wording simply leaves title/subtitle/CTA
 * blank — then nothing is drawn over it.
 *
 * Smooth crossfade, autoplay (pauses on hover), glass arrows, progress dots and
 * touch swipe. Honors prefers-reduced-motion.
 */
const HeroSection: React.FC = () => {
    const { data, isLoading } = useGetSiteContentQuery(undefined);
    const reduce = !!useReducedMotion();

    // Only ever the admin's own banners — there is deliberately no stand-in image
    // to fall back on, because a placeholder banner would flash on every load
    // before the real ones arrive.
    const slides = React.useMemo(() => {
        return ((data?.data?.heroSlides || []) as HeroSlide[])
            .filter((s) => s?.imageUrl && s.active !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [data]);
    const images = React.useMemo(() => slides.map((s) => s.imageUrl), [slides]);

    const multiple = images.length > 1;
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const [cycle, setCycle] = useState(0); // restarts the progress bar after pause/manual nav

    /**
     * The stage takes the ARTWORK's own aspect ratio instead of a fixed height.
     *
     * It used to be a constant height at every breakpoint with the banner
     * cover-fitted into it. Because the uploaded artwork is wide (~3:1) and the
     * phone frame was 1.41:1, covering it blew the image up to ~785px wide
     * inside a 367px window — over half the banner was trimmed off, ~200px from
     * each side. Driving the stage from the image's ratio keeps the whole banner
     * visible at every width; the max-height stops an unusually tall upload from
     * taking over the page. The ratio is measured from the first slide, with a
     * close fallback so nothing jumps while it loads.
     */
    const FALLBACK_AR = 3;
    const STAGE_MAX_H = 560;
    const [ratio, setRatio] = useState<number | null>(null);
    const stageAR = ratio ?? FALLBACK_AR;

    // DefaultHero (shown only when no banners exist) is a designed layout rather
    // than photo artwork, so it keeps real fixed heights.
    const STAGE_HEIGHT = 'h-[260px] sm:h-[360px] md:h-[470px] lg:h-[560px]';

    useEffect(() => { setActive(0); }, [images.length]);

    // Autoplay (pauses on hover, respects reduced motion).
    useEffect(() => {
        if (!multiple || paused || reduce) return;
        const t = setInterval(() => setActive((a) => (a + 1) % images.length), SLIDE_INTERVAL);
        return () => clearInterval(t);
    }, [multiple, paused, reduce, images.length, cycle]);

    const goTo = useCallback((i: number) => {
        setActive(((i % images.length) + images.length) % images.length);
        setCycle((c) => c + 1);
    }, [images.length]);

    // Touch swipe.
    const touchX = useRef<number | null>(null);
    const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (multiple && Math.abs(dx) > 48) goTo(active + (dx < 0 ? 1 : -1));
        touchX.current = null;
    };

    // While the banners are still loading, hold the space with a neutral
    // placeholder rather than a stand-in image — that is what used to flash the
    // old banner on every reload. (Every hook above has already run, so these
    // early returns are safe.)
    if (isLoading) {
        return (
            <section className="w-full" aria-label="Featured banners">
                <div className="w-full">
                    <div className="w-full animate-pulse bg-slate-100" style={{ aspectRatio: FALLBACK_AR, maxHeight: STAGE_MAX_H }} />
                </div>
            </section>
        );
    }
    // Loaded, but the admin hasn't added any banners yet — show the built-in
    // Books-River promo banner (People-Choice-style) so the hero is never empty.
    if (images.length === 0) return <DefaultHero heightClass={STAGE_HEIGHT} />;

    return (
        <section className="w-full" aria-label="Featured banners">
            <div className="w-full">
                <div
                    className="group relative w-full overflow-hidden bg-slate-100"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => { setPaused(false); setCycle((c) => c + 1); }}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    aria-roledescription="carousel"
                >
                    {/* Stage — sized by the artwork's aspect ratio so nothing is cropped. */}
                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: stageAR, maxHeight: STAGE_MAX_H }}>

                        {/* ── Crossfading banner images (+ optional text overlay) ── */}
                        {slides.map((slide, i) => {
                            const isActive = i === active;
                            const src = slide.imageUrl;
                            const href = slide.ctaHref || '/products';
                            const hasText = !!(slide.title || slide.subtitle || slide.ctaLabel);
                            const align = slide.align || 'left';
                            const dark = slide.textTone === 'dark';

                            return (
                                <motion.div
                                    key={`${src}-${i}`}
                                    className="absolute inset-0"
                                    initial={false}
                                    animate={{ opacity: isActive ? 1 : 0 }}
                                    transition={{ duration: reduce ? 0 : FADE_MS / 1000, ease: 'easeInOut' }}
                                    style={{ zIndex: isActive ? 2 : 1 }}
                                    aria-hidden={!isActive}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={src}
                                        alt=""
                                        draggable={false}
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                        fetchPriority={i === 0 ? 'high' : undefined}
                                        onLoad={(e) => {
                                            // The first banner sets the stage's proportions.
                                            if (i !== 0) return;
                                            const el = e.currentTarget;
                                            if (el.naturalWidth && el.naturalHeight) setRatio(el.naturalWidth / el.naturalHeight);
                                        }}
                                        className="h-full w-full object-cover"
                                    />

                                    {hasText && slide.scrim !== false && (
                                        /* Brand-tinted scrim on the text side. Banner artwork is rarely
                                           uniformly dark — this one fades from cream linen to green — so
                                           without it white copy can drop to ~1:1 contrast and vanish.
                                           Fades out well before the product area so the photo stays clean. */
                                        <div
                                            className="pointer-events-none absolute inset-0 z-[5]"
                                            style={{
                                                /* Stops tuned against the actual banner pixels: the weakest
                                                   spot under the copy measures 4.8:1 against white — WCAG AA
                                                   — while the photo stays untouched past ~78%. */
                                                background:
                                                    align === 'right'
                                                        ? 'linear-gradient(to left, rgba(var(--color-primary-rgb),0.94) 0%, rgba(var(--color-primary-rgb),0.90) 42%, rgba(var(--color-primary-rgb),0.55) 58%, rgba(var(--color-primary-rgb),0) 78%)'
                                                        : align === 'center'
                                                            ? 'linear-gradient(to top, rgba(var(--color-primary-rgb),0.88) 0%, rgba(var(--color-primary-rgb),0.60) 55%, rgba(var(--color-primary-rgb),0) 100%)'
                                                            : 'linear-gradient(to right, rgba(var(--color-primary-rgb),0.94) 0%, rgba(var(--color-primary-rgb),0.90) 42%, rgba(var(--color-primary-rgb),0.55) 58%, rgba(var(--color-primary-rgb),0) 78%)',
                                            }}
                                        />
                                    )}

                                    {hasText && (
                                        /* pointer-events-none throughout: the whole banner is a single
                                           link (below), so the "button" stays purely visual and we never
                                           nest one anchor inside another. */
                                        <div
                                            className={`pointer-events-none absolute inset-0 z-[6] flex items-center px-[6%] sm:px-[7%] ${
                                                align === 'right' ? 'justify-end text-right'
                                                    : align === 'center' ? 'justify-center text-center'
                                                        : 'justify-start text-left'
                                            }`}
                                        >
                                            {/* 38% keeps the copy inside the measured-safe zone of the scrim */}
                                            <div className={align === 'center' ? 'max-w-[70%]' : 'max-w-[38%]'}>
                                                {slide.title && (
                                                    <h2
                                                        className={`text-[19px] font-bold leading-[1.2] tracking-tight drop-shadow-sm sm:text-[28px] md:text-[38px] lg:text-[46px] ${
                                                            dark ? 'text-slate-900' : 'text-white'
                                                        }`}
                                                    >
                                                        {slide.title}
                                                    </h2>
                                                )}
                                                {slide.subtitle && (
                                                    <p
                                                        className={`mt-1.5 text-[11px] leading-snug sm:mt-2.5 sm:text-[13px] md:text-[15px] lg:text-[17px] ${
                                                            dark ? 'text-slate-700' : 'text-white/85'
                                                        }`}
                                                    >
                                                        {slide.subtitle}
                                                    </p>
                                                )}
                                                {slide.ctaLabel && (
                                                    <span
                                                        className={`mt-3 inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-bold shadow-lg sm:mt-4 sm:px-6 sm:py-2.5 sm:text-[13px] md:text-[14px] ${
                                                            dark
                                                                ? 'bg-[var(--color-primary)] text-white'
                                                                : 'bg-white text-[var(--color-primary)]'
                                                        }`}
                                                    >
                                                        {slide.ctaLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Full-bleed click target — one link per slide. */}
                                    <Link
                                        href={href}
                                        aria-label={slide.title || 'Shop now'}
                                        tabIndex={isActive ? 0 : -1}
                                        className="absolute inset-0 z-[7]"
                                    />
                                </motion.div>
                            );
                        })}

                        {/* ── Arrows (glass, reveal on hover) ── */}
                        {multiple && (
                            <>
                                <button
                                    onClick={() => goTo(active - 1)}
                                    aria-label="Previous banner"
                                    className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/45 group-hover:opacity-100 md:flex"
                                >
                                    <LuChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => goTo(active + 1)}
                                    aria-label="Next banner"
                                    className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-black/45 group-hover:opacity-100 md:flex"
                                >
                                    <LuChevronRight size={18} />
                                </button>
                            </>
                        )}

                        {/* ── Progress dots ── */}
                        {multiple && (
                            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
                                {images.map((_, i) => {
                                    const isOn = i === active;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => goTo(i)}
                                            aria-label={`Go to banner ${i + 1}`}
                                            className={`relative h-[5px] overflow-hidden rounded-full shadow-sm ring-1 ring-black/5 transition-all duration-300 ${
                                                isOn ? 'w-9 bg-white/45' : 'w-[14px] bg-white/55 hover:bg-white/80'
                                            }`}
                                        >
                                            {isOn && (
                                                <AnimatePresence>
                                                    <motion.span
                                                        key={`${active}-${cycle}-${paused}`}
                                                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                                                        initial={{ width: '0%' }}
                                                        animate={{ width: paused || reduce ? '100%' : ['0%', '100%'] }}
                                                        transition={paused || reduce ? { duration: 0.3 } : { duration: SLIDE_INTERVAL / 1000, ease: 'linear' }}
                                                    />
                                                </AnimatePresence>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

/* ══════════════════════════════════════════════════════════════════
 *  DefaultHero — built-in promo banner shown when the admin has not yet
 *  uploaded any hero slides. Recreates the People-Choice hero: a light
 *  doodle background, a big Bengali headline + the signature orange
 *  "visit our site" search-bar graphic on the left, and a book image on
 *  the right. Admin-uploaded banners take precedence over this.
 * ════════════════════════════════════════════════════════════════════ */
type DHSlide = {
    kicker: string;
    title: string;
    sub?: string;
    mode: 'search' | 'offer';
    href: string;
    img: string;
};
const DEFAULT_SLIDES: DHSlide[] = [
    {
        kicker: 'ENGLISH ও বাংলা বই',
        title: 'আপনার পছন্দের যেকোন বই অর্ডার করতে ভিজিট করুন',
        mode: 'search',
        href: '/products',
        img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    },
    {
        kicker: 'কমিকস কালেকশন',
        title: 'আপনার পছন্দের যেকোন কমিকস অর্ডার করতে ভিজিট করুন',
        sub: 'টিনটিন · চাচা চৌধুরী · বাটুল দি গ্রেট · নন্টে-ফন্টে · অ্যাসটেরিক্স · হাঁদা ভোঁদা',
        mode: 'search',
        href: '/products?category=comic-books',
        img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=80',
    },
    {
        kicker: 'ফ্রি হোম ডেলিভারি',
        title: '৳১৪৯৯+ অর্ডারে সারাদেশে ফ্রি ডেলিভারি',
        sub: 'ক্যাশ অন ডেলিভারি · ২-৪ দিনে হোম ডেলিভারি',
        mode: 'offer',
        href: '/products',
        img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    },
];

// A few faint "school doodle" marks scattered behind the banner (People-Choice vibe).
const DOODLES = ['+', '×', '÷', '=', 'π', '√', '%', 'a²'];

const DefaultHero: React.FC<{ heightClass: string }> = ({ heightClass }) => {
    const [i, setI] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setI((v) => (v + 1) % DEFAULT_SLIDES.length), 9000);
        return () => clearInterval(t);
    }, []);
    return (
        <section className="w-full" aria-label="Featured banner">
            <div className="w-full">
                <div
                    className={`relative w-full overflow-hidden ${heightClass}`}
                    style={{ background: 'linear-gradient(180deg,#eef0f2,#e7e9ec)' }}
                >
                    {/* faint school doodles */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
                        {DOODLES.map((d, k) => (
                            <span
                                key={k}
                                className="absolute font-extrabold"
                                style={{
                                    left: `${(k * 13 + 7) % 92}%`,
                                    top: `${(k * 29 + 10) % 80}%`,
                                    fontSize: `${18 + (k % 4) * 12}px`,
                                    color: 'rgba(108,46,0,0.07)',
                                    transform: `rotate(${(k % 2 ? -1 : 1) * (10 + k * 6)}deg)`,
                                }}
                            >
                                {d}
                            </span>
                        ))}
                    </div>

                    {DEFAULT_SLIDES.map((s, idx) => (
                        <div
                            key={idx}
                            className="absolute inset-0 transition-opacity duration-700"
                            style={{ opacity: i === idx ? 1 : 0, zIndex: i === idx ? 2 : 1 }}
                            aria-hidden={i !== idx}
                        >
                            {/* Right-side book image, fading into the doodle background */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={s.img}
                                alt=""
                                draggable={false}
                                className="absolute right-0 top-0 h-full w-[46%] sm:w-[42%] object-cover"
                                style={{ maskImage: 'linear-gradient(to right, transparent, #000 38%)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 38%)' }}
                            />

                            {/* Left copy */}
                            <div className="relative z-[3] h-full flex flex-col justify-center px-4 sm:px-8 lg:px-12 max-w-[70%] sm:max-w-[62%]">
                                <span className="inline-block self-start text-[9px] sm:text-[11px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full mb-1.5 sm:mb-3" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                                    {s.kicker}
                                </span>
                                <h2
                                    className="font-extrabold leading-[1.15] tracking-tight text-[16px] sm:text-[26px] md:text-[34px] lg:text-[40px]"
                                    style={{ color: '#4a2410', textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}
                                >
                                    {s.title}
                                </h2>
                                {s.sub && (
                                    <p className="mt-1 sm:mt-2 text-[10px] sm:text-[13px] md:text-[14px] font-semibold leading-snug" style={{ color: '#7a5a3f' }}>
                                        {s.sub}
                                    </p>
                                )}

                                {s.mode === 'search' ? (
                                    <Link href={s.href} className="mt-2.5 sm:mt-5 flex items-stretch w-full max-w-[300px] sm:max-w-[380px] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl hover:brightness-105 active:scale-[0.99] transition-all">
                                        <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 px-2.5 sm:px-4 py-2 sm:py-3" style={{ background: 'var(--color-primary)' }}>
                                            <span className="flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white shrink-0"><LuGlobe size={13} style={{ color: 'var(--color-primary)' }} /></span>
                                            <span className="w-px h-4 sm:h-6 bg-white/40 shrink-0" />
                                            <span className="text-white font-extrabold text-[13px] sm:text-[18px] md:text-[20px] tracking-tight truncate">booksriver.com</span>
                                        </div>
                                        <div className="flex items-center justify-center px-3 sm:px-4 shrink-0" style={{ background: '#a8440a' }}>
                                            <LuSearch size={16} className="text-white sm:hidden" />
                                            <LuSearch size={22} className="text-white hidden sm:block" />
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="mt-2 sm:mt-4 flex items-end gap-3">
                                        <div className="leading-none font-extrabold" style={{ color: '#1b2a4a' }}>
                                            <span className="text-[24px] sm:text-[40px] md:text-[48px]">৳১৪৯৯+</span>{' '}
                                            <span className="text-[18px] sm:text-[28px]" style={{ color: 'var(--color-primary)' }}>ফ্রি</span>
                                            <div className="text-[10px] sm:text-[13px] font-bold mt-1 flex items-center gap-1.5" style={{ color: '#5a4434' }}>
                                                <span>🇧🇩</span> সারাদেশে হোম ডেলিভারি
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* dots — rounded, centered */}
                    <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
                        {DEFAULT_SLIDES.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setI(idx)}
                                aria-label={`Go to slide ${idx + 1}`}
                                className="rounded-full transition-all"
                                style={{
                                    width: i === idx ? 12 : 9,
                                    height: i === idx ? 12 : 9,
                                    background: i === idx ? 'var(--color-primary)' : 'rgba(108,46,0,0.28)',
                                    boxShadow: i === idx ? '0 0 0 3px rgba(var(--color-primary-rgb),0.2)' : 'none',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
