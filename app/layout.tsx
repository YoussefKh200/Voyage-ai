import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voyage AI — Plan smarter. Travel deeper.",
  description: "AI-powered travel planning. Generate complete day-by-day itineraries in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
