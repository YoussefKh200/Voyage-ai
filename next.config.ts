// next.config.ts — Production-hardened Next.js configuration
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // ── Image optimization ──────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "maps.gstatic.com" },
    ],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ── Compiler optimizations ──────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production (keep warn/error)
    removeConsole: isDev ? false : { exclude: ["warn", "error"] },
  },

  // ── Server external packages ────────────────────────────────────────────────
  // Prevent Prisma (Node-only) from being bundled into client chunks
  serverExternalPackages: ["@prisma/client", "prisma"],

  // ── Experimental ────────────────────────────────────────────────────────────
  experimental: {
    // Optimize package imports for tree-shaking
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "date-fns",
      "@vercel/analytics",
      "@vercel/speed-insights",
    ],
  },

  // ── HTTP response headers ───────────────────────────────────────────────────
  // These apply to ALL responses. Middleware adds per-route headers.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control",  value: "on" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache public images
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      // Never cache API responses
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },

  // ── Redirects ────────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Common typo paths
      { source: "/plan",     destination: "/planner",   permanent: true },
      { source: "/generate", destination: "/planner",   permanent: true },
      { source: "/trip",     destination: "/planner",   permanent: false },
    ];
  },

  // ── Bundle analysis ─────────────────────────────────────────────────────────
  // Run: ANALYZE=true npm run build
  ...(process.env.ANALYZE === "true"
    ? { productionBrowserSourceMaps: true }
    : {}),

  // ── Output mode for Vercel ──────────────────────────────────────────────────
  output: "standalone",

  // ── PoweredBy header ────────────────────────────────────────────────────────
  poweredByHeader: false, // Don't leak Next.js version
};

export default nextConfig;
