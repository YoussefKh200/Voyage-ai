"use client";
// components/itinerary/ItinerarySkeleton.tsx — Cinematic loading state

export function ItinerarySkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="glass rounded-3xl border border-white/8 overflow-hidden">
        <div className="px-8 py-10 space-y-5">
          <div className="skeleton h-3 w-40 rounded-full" />
          <div className="skeleton h-12 w-72 rounded-xl" />
          <div className="skeleton h-5 w-56 rounded-lg" />
          <div className="flex gap-3 pt-2">
            {[80, 96, 72, 88].map((w, i) => (
              <div key={i} className="skeleton h-14 rounded-xl flex-shrink-0" style={{ width: w }} />
            ))}
          </div>
        </div>
        <div className="px-8 pb-7">
          <div className="skeleton h-4 w-full rounded-lg mb-2" />
          <div className="skeleton h-4 w-4/5 rounded-lg" />
        </div>
      </div>

      {/* Map skeleton */}
      <div className="skeleton h-[280px] w-full rounded-2xl" />

      {/* Day skeletons */}
      {[1, 2, 3].map((i) => (
        <DaySkeleton key={i} index={i} />
      ))}
    </div>
  );
}

function DaySkeleton({ index }: { index: number }) {
  return (
    <div
      className="glass rounded-3xl border border-white/8 p-7 animate-fade-up opacity-0"
      style={{ animationDelay: `${index * 120}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center gap-5 mb-6">
        <div className="skeleton w-12 h-12 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-48 rounded-lg" />
          <div className="skeleton h-3.5 w-32 rounded-md" />
        </div>
        <div className="skeleton h-5 w-16 rounded-lg hidden sm:block" />
      </div>

      <div className="space-y-3">
        {[1, 2].map((j) => (
          <div key={j} className="glass-surface rounded-2xl p-5 flex gap-4 border border-white/5">
            <div className="flex-shrink-0 space-y-1.5">
              <div className="skeleton h-4 w-12 rounded" />
              <div className="skeleton h-3 w-8 rounded" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-48 rounded-lg" />
              <div className="skeleton h-3.5 w-full rounded" />
              <div className="skeleton h-3.5 w-3/4 rounded" />
              <div className="flex gap-3 pt-1">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Full-page generating state ────────────────────────────────────────────────

export function GeneratingState() {
  const steps = [
    { icon: "🗺️",  label: "Researching destination",    delay: 0 },
    { icon: "📍",  label: "Mapping top attractions",     delay: 800 },
    { icon: "🍽️",  label: "Curating restaurants",        delay: 1600 },
    { icon: "🗓️",  label: "Scheduling your days",        delay: 2400 },
    { icon: "💰",  label: "Estimating costs",            delay: 3200 },
    { icon: "✨",  label: "Polishing your itinerary",    delay: 4000 },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 generating-bg">
      {/* Pulsing orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="orb w-96 h-96 top-1/4 left-1/4 opacity-10 animate-float"
             style={{ background: "radial-gradient(circle, #d4a853, transparent 70%)" }} />
        <div className="orb w-80 h-80 bottom-1/4 right-1/4 opacity-8 animate-float-reverse"
             style={{ background: "radial-gradient(circle, #e2714b, transparent 70%)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#d4a853] border-r-[#e2714b]"
            style={{ animation: "rotateSlow 1.4s linear infinite" }}
          />
          <div
            className="absolute inset-2 rounded-full border border-transparent border-t-[#d4a853]/40"
            style={{ animation: "rotateSlow 2.2s linear infinite reverse" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">✈️</div>
        </div>

        <h2 className="font-display text-3xl font-bold text-white mb-3">
          Crafting your trip
        </h2>
        <p className="text-white/40 text-sm mb-12 leading-relaxed">
          Our AI is designing your perfect itinerary — give it a moment.
        </p>

        {/* Progress steps */}
        <div className="space-y-3 text-left">
          {steps.map((step, i) => (
            <GeneratingStep key={i} {...step} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GeneratingStep({
  icon, label, delay, index,
}: {
  icon: string; label: string; delay: number; index: number;
}) {
  const [active, setActive] = useState(false);
  const [done,   setDone]   = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setActive(true), delay);
    const t2 = setTimeout(() => setDone(true), delay + 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500",
        done   ? "border-[#d4a853]/30 bg-[#d4a853]/8"   :
        active ? "border-white/15 bg-white/5 generating-border" :
                 "border-white/5  bg-transparent opacity-35"
      )}
    >
      <span className={cn("text-lg transition-all duration-300", active ? "scale-110" : "scale-100")}>
        {icon}
      </span>
      <span className={cn(
        "text-sm font-medium flex-1 transition-colors duration-300",
        active ? "text-white" : "text-white/35"
      )}>
        {label}
      </span>
      {done && (
        <div className="w-5 h-5 rounded-full bg-[#d4a853]/20 flex items-center justify-center flex-shrink-0">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5 4-4" stroke="#d4a853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {active && !done && (
        <div className="flex gap-1 flex-shrink-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-[#d4a853]/70"
              style={{ animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
