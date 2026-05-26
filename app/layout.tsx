// app/layout.tsx — Root layout with full SEO + analytics + a11y
import type { Metadata, Viewport } from "next";
import { Analytics }      from "@vercel/analytics/react";
import { SpeedInsights }  from "@vercel/speed-insights/next";
import "./globals.css";
import { SkipToContent } from "@/components/shared/Accessibility";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://voyage-ai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default:  "Voyage AI — Plan smarter. Travel deeper.",
    template: "%s | Voyage AI",
  },
  description:
    "AI-powered travel planning. Generate complete, personalised day-by-day itineraries in seconds — with restaurants, activities, budgets, and transport all planned for you.",
  keywords: [
    "travel planner", "AI itinerary", "trip planning", "vacation planner",
    "travel AI", "personalized travel", "day trip planner", "travel assistant",
  ],
  authors:  [{ name: "Voyage AI" }],
  creator:  "Voyage AI",
  publisher:"Voyage AI",

  openGraph: {
    type:        "website",
    locale:      "en_US",
    url:         APP_URL,
    siteName:    "Voyage AI",
    title:       "Voyage AI — AI-powered Travel Planning",
    description: "Generate complete personalised travel itineraries in seconds. Activities, restaurants, budgets, and transport — all planned by AI.",
    images: [{
      url:    "/og-image.png",
      width:  1200,
      height: 630,
      alt:    "Voyage AI — Plan smarter. Travel deeper.",
    }],
  },

  twitter: {
    card:        "summary_large_image",
    title:       "Voyage AI — Plan smarter. Travel deeper.",
    description: "Generate complete personalised travel itineraries in seconds with AI.",
    images:      ["/og-image.png"],
    creator:     "@voyageai",
  },

  robots: {
    index:                   true,
    follow:                  true,
    googleBot: {
      index:                 true,
      follow:                true,
      "max-video-preview":   -1,
      "max-image-preview":   "large",
      "max-snippet":         -1,
    },
  },

  icons: {
    icon:        [{ url: "/favicon.ico" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple:       [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut:    "/favicon.ico",
  },

  manifest:    "/manifest.json",
  category:    "travel",
};

export const viewport: Viewport = {
  themeColor:    "#d4a853",
  width:         "device-width",
  initialScale:  1,
  maximumScale:  5,
  userScalable:  true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.open-meteo.com" />
      </head>
      <body>
        <SkipToContent />
        {children}

        {/* Vercel Analytics — tracks page views, web vitals */}
        <Analytics />

        {/* Vercel Speed Insights — Core Web Vitals reporting */}
        <SpeedInsights />
      </body>
    </html>
  );
}
