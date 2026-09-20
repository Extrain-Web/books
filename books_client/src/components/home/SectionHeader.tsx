"use client";

import React from 'react';
import Link from 'next/link';
import { LuChevronRight } from 'react-icons/lu';

interface SectionHeaderProps {
    /** Bold section title shown on the left (Daraz style). */
    title: string;
    /**
     * Optional one-line description under the title. Hidden on mobile so the
     * header stays a single line on small screens and two lines at most on
     * desktop.
     */
    subtitle?: string;
    /** Optional small accent line drawn before the title. */
    accent?: boolean;
    /** Optional link target for the right-side "See More ›" action. */
    seeMoreHref?: string;
    /** Custom label for the right-side link (defaults to "See More"). */
    seeMoreLabel?: string;
}

/**
 * Reusable Daraz-style section header: bold title on the left and an optional
 * "See More ›" link on the right. Used by the home page row sections so they all
 * share the exact same look.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    accent = true,
    seeMoreHref,
    seeMoreLabel = 'View all',
}) => {
    // People-Choice-style two-tone heading: last word painted in the brand colour.
    const words = title.trim().split(/\s+/);
    const last = words.length > 1 ? words.pop() : undefined;
    const lead = words.join(' ');

    return (
        <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
                {accent && (
                    <span
                        className="w-[4px] h-6 sm:h-7 rounded-full shrink-0"
                        style={{ background: 'var(--color-primary)' }}
                    />
                )}
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate" style={{ color: '#2A1A12' }}>
                        {last ? <>{lead} <span style={{ color: 'var(--color-primary)' }}>{last}</span></> : <span style={{ color: 'var(--color-primary)' }}>{title}</span>}
                    </h2>
                    {subtitle && (
                        <p className="hidden sm:block text-xs text-gray-500 mt-0.5 truncate">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {seeMoreHref && (
                <Link
                    href={seeMoreHref}
                    className="flex items-center gap-1 text-xs sm:text-[13px] font-bold text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0"
                    style={{ background: 'var(--color-primary)' }}
                >
                    {seeMoreLabel} <LuChevronRight size={15} />
                </Link>
            )}
        </div>
    );
};

export default SectionHeader;
