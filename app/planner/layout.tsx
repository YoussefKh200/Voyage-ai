// app/planner/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan Your Trip",
  description: "Build your personalised AI travel itinerary in 4 simple steps. Choose your destination, budget, and interests.",
  alternates: { canonical: "/planner" },
  robots: { index: false }, // Don't index the planner — dynamic per-user form
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" tabIndex={-1}>
      {children}
    </div>
  );
}
