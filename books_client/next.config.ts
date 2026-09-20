import type { NextConfig } from "next";

/**
 * Hostnames allowed for next/image.
 *
 * The backend host is NOT hardcoded: it is derived from NEXT_PUBLIC_API_URL at
 * build time, so the same code works on Coolify's temporary *.sslip.io URL now
 * and on the real domain later — only the build variable changes.
 */
const apiHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  // Emit .next/standalone so the Docker image ships only the server plus the
  // node_modules it actually imports (needed by the Dockerfile / Coolify).
  output: "standalone",
  // React Compiler is disabled: with it on, Suspense-wrapped pages could get
  // stuck on their fallback/loading state (Next 16.1.2 + React 19). Leave off
  // until that interaction is resolved upstream.
  reactCompiler: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },

      // Local dev: backend runs on http://localhost:5000.
      { protocol: "http", hostname: "localhost", port: "5000" },

      // Coolify's auto-generated preview domains (used until DNS is pointed).
      { protocol: "http", hostname: "**.sslip.io" },
      { protocol: "https", hostname: "**.sslip.io" },

      // Production domain (apex + every subdomain, e.g. api. and www.).
      { protocol: "https", hostname: "bichitrapoint.com" },
      { protocol: "https", hostname: "**.bichitrapoint.com" },

      // Whatever NEXT_PUBLIC_API_URL points at, always allowed.
      ...(apiHostname
        ? [
            { protocol: "http" as const, hostname: apiHostname },
            { protocol: "https" as const, hostname: apiHostname },
          ]
        : []),
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin/:path*",
        destination: "/dashboard/admin/:path*",
        permanent: true,
      },
      {
        source: "/user/:path*",
        destination: "/dashboard/user/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
