// app/itinerary/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Itinerary",
  description: "Your AI-generated travel itinerary with day-by-day activities, restaurants, transport, and cost estimates.",
  robots: { index: false }, // User-generated content — don't index
};

export default function ItineraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" tabIndex={-1}>
      {children}
    </div>
  );
}
