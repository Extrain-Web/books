/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { IconContext } from 'react-icons';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import brand from '@/config/brand';

interface ThemeContextType {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    storeName: string;
    tagline: string;
    seoTitle: string;
    seoDescription: string;
    currency: string;
    isLoaded: boolean;
}

const defaultTheme: ThemeContextType = {
    primaryColor: brand.primary,
    secondaryColor: brand.secondary,
    logoUrl: '',
    faviconUrl: '',
    storeName: 'Bichitra Point',
    tagline: 'Your trusted online marketplace',
    seoTitle: 'Bichitra Point - Your trusted online marketplace',
    seoDescription: 'Shop quality products at the best prices with Bichitra Point, your trusted online marketplace in Bangladesh.',
    currency: 'BDT',
    isLoaded: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

/* ─────────────────────────────────────────────────────────────────── */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: res } = useGetSiteContentQuery({});
    const [themeData, setThemeData] = useState<ThemeContextType>(defaultTheme);

    useEffect(() => {
        if (!res?.data) return;
        const t = res.data.theme || {};
        const g = res.data.general || {};
        const s = res.data.seo || {};
        const favicon = t.faviconUrl || t.logoUrl || '';
        const storeName = g.storeName || 'Bichitra Point';
        const tagline = g.tagline || 'Your trusted online marketplace';
        const seoTitle = s.title || `${storeName} — ${tagline}`;
        const seoDescription = s.description || 'Shop quality products at the best prices with Bichitra Point, your trusted online marketplace in Bangladesh.';

        setThemeData({
            primaryColor: brand.primary,
            secondaryColor: brand.secondary,
            logoUrl: t.logoUrl || '',
            faviconUrl: favicon,
            storeName,
            tagline,
            seoTitle,
            seoDescription,
            currency: g.currency || 'BDT',
            isLoaded: true,
        });

        // Dynamically update document title & favicon safely
        if (typeof document !== 'undefined') {
            if (seoTitle && document.title !== seoTitle) {
                document.title = seoTitle;
            }
            if (favicon) {
                const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
                if (existingIcons.length > 0) {
                    existingIcons.forEach((el) => {
                        el.href = favicon;
                    });
                } else {
                    const link = document.createElement('link');
                    link.id = 'dynamic-favicon';
                    link.rel = 'icon';
                    link.href = favicon;
                    document.head.appendChild(link);
                }
            }
        }
    }, [res]);

    return (
        <ThemeContext.Provider value={themeData}>
            {/* Global icon defaults — a consistent class on every react-icons SVG
               so outline (Lucide) icons render with a refined, uniform stroke. */}
            <IconContext.Provider value={{ className: 'app-icon' }}>
                {children}
            </IconContext.Provider>
        </ThemeContext.Provider>
    );
}
