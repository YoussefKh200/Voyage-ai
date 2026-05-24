import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow AI provider image domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
    ],
  },
  // Ensure server-only modules don't leak to client bundle
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
