import type { MetadataRoute } from "next";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://voyage-ai.vercel.app";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/planner"], disallow: ["/api/", "/itinerary"] }],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
