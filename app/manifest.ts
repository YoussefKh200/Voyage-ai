import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voyage AI", short_name: "Voyage AI",
    description: "AI-powered travel planning. Plan smarter. Travel deeper.",
    start_url: "/", display: "standalone",
    background_color: "#0f0e17", theme_color: "#d4a853", orientation: "portrait-primary",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    categories: ["travel", "productivity"],
  };
}
