import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/redux";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { brandCssVariables, brandFontsHref } from "@/config/brand";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.booksriver.com"),
  title: {
    default: "Books River — The Reading Journey",
    template: "Books River | %s",
  },
  description: "Books River is your trusted online bookstore in Bangladesh — comics, manga, children's books, curriculum & essential books, stationery and more, delivered nationwide.",
  keywords: ["books river", "booksriver", "online bookstore", "comics", "manga", "children books", "stationery", "bangladesh", "books"],
  applicationName: "Books River",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    type: "website",
    siteName: "Books River",
    title: "Books River — The Reading Journey",
    description: "Your trusted online bookstore in Bangladesh — comics, manga, children's & curriculum books, stationery and more.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Books River — The Reading Journey",
    description: "Your trusted online bookstore in Bangladesh — comics, manga, children's & curriculum books, stationery and more.",
  },
  robots: { index: true, follow: true },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Brand palette — generated from the single BRAND_PRIMARY constant in
            src/config/brand.ts and inlined server-side, so every
            var(--color-primary) resolves on the first paint (no colour flash). */}
        <style id="brand-palette" dangerouslySetInnerHTML={{ __html: brandCssVariables() }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Built from BRAND_FONT / BRAND_FONT_BANGLA in src/config/brand.ts, so
            changing the typeface there also changes what gets downloaded — no
            stale font request left behind. */}
        <link href={brandFontsHref()} rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ReduxProvider>
          <ThemeProvider>
            <Toaster position="top-center" reverseOrder={false} />
            {children}
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
