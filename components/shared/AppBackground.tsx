"use client";
// components/shared/AppBackground.tsx
// ─── Shared ambient background ────────────────────────────────────────────────
// Was copy-pasted verbatim across landing, planner, and itinerary pages.
// Extracted into a single fixed component.
// `variant` controls the orb intensity — landing gets more dramatic treatment.

interface AppBackgroundProps {
  variant?: "default" | "subtle";
}

export function AppBackground({ variant = "default" }: AppBackgroundProps) {
  const topOpacity = variant === "subtle" ? "0.08" : "0.12";
  const bottomOpacity = variant === "subtle" ? "0.05" : "0.08";

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, #d4a853, transparent 70%)",
          filter: "blur(80px)",
          opacity: topOpacity,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, #e2714b, transparent 70%)",
          filter: "blur(80px)",
          opacity: bottomOpacity,
        }}
      />
    </div>
  );
}
