"use client";

import React from 'react';
import Link from 'next/link';
import { LuChevronLeft, LuMail, LuCalendar } from 'react-icons/lu';
import { useGetLegalPageQuery } from '@/redux/api/siteContentApi';

interface LegalPageProps {
    slug: string;
    fallbackTitle: string;
    icon: React.ReactNode;
    accentColor: string;
    ctaTitle: string;
    ctaDescription: string;
    ctaButtonText: string;
}

const LegalPageLayout = ({ slug, fallbackTitle, icon, accentColor, ctaTitle, ctaDescription, ctaButtonText }: LegalPageProps) => {
    const { data: response, isLoading } = useGetLegalPageQuery(slug);
    const page = response?.data;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-[3px] border-gray-100 border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-gray-400 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    const lastUpdated = page?.lastUpdated
        ? new Date(page.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    return (
        <div className="bg-[#fafbfc] min-h-screen">
            {/* ══ HERO HEADER ══ */}
            <div className="bg-gradient-to-b from-white to-gray-50/80 border-b border-gray-200/80">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
                    {/* Breadcrumb */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[var(--color-primary)] uppercase tracking-wider mb-6 transition-colors"
                    >
                        <LuChevronLeft size={14} />
                        Back to Home
                    </Link>

                    {/* Icon Badge */}
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
                        style={{ background: `${accentColor}14`, color: accentColor }}
                    >
                        {icon}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        {page?.title || fallbackTitle}
                    </h1>

                    {/* Last Updated */}
                    {lastUpdated && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-100/80 px-3.5 py-1 rounded-full mt-2">
                            <LuCalendar size={12} className="text-gray-400" />
                            Last updated: {lastUpdated}
                        </div>
                    )}
                </div>
            </div>

            {/* ══ CONTENT ══ */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
                <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-10 md:p-12 shadow-sm overflow-hidden w-full">
                    <div
                        className="legal-content w-full max-w-full overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: page?.content || '<p>Content coming soon.</p>' }}
                    />
                </div>

                {/* ══ CONTACT CTA ══ */}
                <div className="mt-8 text-center p-7 sm:p-9 bg-white rounded-2xl border border-gray-200/90 shadow-sm w-full">
                    <h3 className="text-base font-bold text-gray-900 mb-1">{ctaTitle}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-5">{ctaDescription}</p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-lg text-xs sm:text-sm font-bold tracking-wide transition-all shadow-sm"
                    >
                        <LuMail size={15} />
                        {ctaButtonText}
                    </Link>
                </div>
            </div>

            <style>{`
                .legal-content {
                    font-size: 15px;
                    line-height: 1.8;
                    color: #374151;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    word-break: break-word;
                    max-width: 100%;
                }
                .legal-content * {
                    max-width: 100%;
                    box-sizing: border-box;
                }
                .legal-content h1 {
                    font-size: 24px;
                    font-weight: 800;
                    color: #111827;
                    margin: 32px 0 14px;
                    letter-spacing: -0.02em;
                    line-height: 1.3;
                    word-break: break-word;
                }
                .legal-content h2 {
                    font-size: 19px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 28px 0 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #f3f4f6;
                    line-height: 1.35;
                    word-break: break-word;
                }
                .legal-content h3 {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 22px 0 10px;
                    line-height: 1.4;
                    word-break: break-word;
                }
                .legal-content h4 {
                    font-size: 15px;
                    font-weight: 600;
                    color: #374151;
                    margin: 18px 0 8px;
                    word-break: break-word;
                }
                .legal-content p {
                    font-size: 15px;
                    line-height: 1.8;
                    color: #374151;
                    margin-bottom: 16px;
                    word-break: break-word;
                }
                .legal-content span {
                    word-break: break-word;
                }
                .legal-content ul, .legal-content ol {
                    padding-left: 24px;
                    margin: 12px 0 18px;
                    word-break: break-word;
                }
                .legal-content ul {
                    list-style-type: disc;
                }
                .legal-content ol {
                    list-style-type: decimal;
                }
                .legal-content li {
                    font-size: 15px;
                    line-height: 1.8;
                    color: #374151;
                    margin-bottom: 8px;
                    word-break: break-word;
                }
                .legal-content li::marker {
                    color: var(--color-primary);
                }
                .legal-content blockquote {
                    border-left: 3px solid var(--color-primary);
                    padding: 14px 20px;
                    background: #f9fafb;
                    margin: 20px 0;
                    border-radius: 0 10px 10px 0;
                    font-style: italic;
                    color: #4b5563;
                    word-break: break-word;
                }
                .legal-content a {
                    color: var(--color-primary);
                    font-weight: 600;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                    word-break: break-all;
                }
                .legal-content a:hover {
                    color: var(--color-primary-dark);
                }
                .legal-content strong, .legal-content b {
                    color: #111827;
                    font-weight: 700;
                }
                .legal-content hr {
                    border: none;
                    border-top: 1px solid #e5e7eb;
                    margin: 32px 0;
                }
                .legal-content table {
                    width: 100%;
                    max-width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                    font-size: 14px;
                    display: block;
                    overflow-x: auto;
                }
                .legal-content th, .legal-content td {
                    padding: 12px 16px;
                    border: 1px solid #e5e7eb;
                    text-align: left;
                    word-break: break-word;
                }
                .legal-content th {
                    background: #f9fafb;
                    font-weight: 700;
                    color: #111827;
                }
                .legal-content img, .legal-content video, .legal-content iframe {
                    max-width: 100% !important;
                    height: auto !important;
                    border-radius: 8px;
                    margin: 12px 0;
                }
                .legal-content pre, .legal-content code {
                    max-width: 100%;
                    white-space: pre-wrap;
                    word-break: break-all;
                    background: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 6px;
                }
                /* Quill rich text support */
                .legal-content .ql-align-center { text-align: center; }
                .legal-content .ql-align-right { text-align: right; }
                .legal-content .ql-align-justify { text-align: justify; }
                .legal-content .ql-size-small { font-size: 13px; }
                .legal-content .ql-size-large { font-size: 18px; }
                .legal-content .ql-size-huge { font-size: 24px; }
                @media (max-width: 640px) {
                    .legal-content { font-size: 14px; }
                    .legal-content h1 { font-size: 20px; }
                    .legal-content h2 { font-size: 17px; }
                    .legal-content p, .legal-content li { font-size: 14px; }
                }
            `}</style>
        </div>
    );
};

export default LegalPageLayout;
