import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/redux";
import FloatingContact from "@/components/shared/FloatingContact";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { brandCssVariables, brandFontsHref } from "@/config/brand";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.bichitrapoint.com"),
  title: {
    default: "Bichitra Point — Your trusted online marketplace",
    template: "Bichitra Point | %s",
  },
  description: "Shop quality products at the best prices with Bichitra Point, your trusted online marketplace in Bangladesh.",
  keywords: ["bichitra point", "bichitrapoint", "online shopping", "ecommerce", "bangladesh", "marketplace", "best deals", "products"],
  applicationName: "Bichitra Point",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    type: "website",
    siteName: "Bichitra Point",
    title: "Bichitra Point — Your trusted online marketplace",
    description: "Shop quality products at the best prices with Bichitra Point, your trusted online marketplace in Bangladesh.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bichitra Point — Your trusted online marketplace",
    description: "Shop quality products at the best prices with Bichitra Point, your trusted online marketplace in Bangladesh.",
  },
  robots: { index: true, follow: true },
};

import { Toaster } from 'react-hot-toast';
import AppLoader from "@/components/shared/AppLoader";

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
            <AppLoader />
            <Toaster position="top-center" reverseOrder={false} />
            {children}
            <FloatingContact />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
