/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

/**
 * Brand Logo component.
 *
 * Dynamically displays the uploaded website logo or brand mark alongside the
 * dynamic store name (e.g. "Books River") and tagline from `useTheme()`.
 */
interface LogoProps {
    /** Logo height in px (used when `imgClassName` is not set). */
    size?: number;
    /** On a dark background — emblem + white wordmark. */
    light?: boolean;
    /** Wrap the logo & wordmark in a white rounded chip. */
    boxed?: boolean;
    /** Kept for API compatibility. */
    showTagline?: boolean;
    /** Kept for explicit wordmark control (defaults to true unless iconOnly is true). */
    showWordmark?: boolean;
    /** Render only the compact emblem (no wordmark text) — for tight spaces. */
    iconOnly?: boolean;
    className?: string;
    /** Tailwind height utilities for the logo (e.g. "h-[40px] md:h-[50px]"). Overrides `size`. */
    imgClassName?: string;
}

const DEFAULT_LOGO_MARK = '/Books-River-Logo-Colored.png';
const DEFAULT_LOGO_LIGHT = '/Books-River-Logo.png';
const DEFAULT_LOGO_FULL = '/Books-River-Logo-Colored.png';

const Logo: React.FC<LogoProps> = ({
    size = 40,
    light = false,
    boxed = false,
    iconOnly = false,
    showWordmark = true,
    className,
    imgClassName,
}) => {
    const { logoUrl, storeName, tagline } = useTheme();
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [logoUrl]);

    const currentStoreName = storeName || 'Books River';
    const currentTagline = tagline || 'Your trusted online marketplace';

    const hasCustomLogo = Boolean(
        logoUrl &&
        logoUrl.trim() !== '' &&
        logoUrl !== '/images/logo.png' &&
        logoUrl !== '/logo.png' &&
        logoUrl !== '/logo-mark.png' &&
        logoUrl !== '/logo.webp' &&
        logoUrl !== '/logo.jpg' &&
        logoUrl !== '/logo-mark.jpg' &&
        !logoUrl.endsWith('/logo.png') &&
        !logoUrl.endsWith('/logo-mark.png') &&
        !imgError
    );
    const defaultLogo = light ? DEFAULT_LOGO_LIGHT : DEFAULT_LOGO_MARK;
    const activeSrc = hasCustomLogo && logoUrl ? logoUrl : defaultLogo;

    const heightStyle = imgClassName ? undefined : { height: size };
    const imgStyle: React.CSSProperties = { ...heightStyle, width: 'auto', display: 'block' };

    const mark = (src: string) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={currentStoreName}
            draggable={false}
            onError={() => {
                if (src === logoUrl) {
                    setImgError(true);
                }
            }}
            className={`${imgClassName || ''} object-contain`}
            style={imgStyle}
        />
    );

    // Boxed mode (in white container)
    if (boxed) {
        return (
            <span
                className={className}
                style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: '#fff', borderRadius: 10, padding: '4px 10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
            >
                {mark(DEFAULT_LOGO_MARK)}
            </span>
        );
    }

    // Direct clean logo image
    return (
        <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {mark(activeSrc)}
        </span>
    );
};

/** Compact brand mark — same logo API, used where space is tight. */
export const LogoMark: React.FC<LogoProps> = (props) => <Logo {...props} />;

export default Logo;


