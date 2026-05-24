"use client";
// components/itinerary/DayCard.tsx — Animated timeline day card

import { useState, useRef } from "react";
import type { GeneratedDay } from "@/types";
import { ActivityCard } from "./ActivityCard";
import { MealCard } from "./MealCard";
import { TransportSection } from "./TransportSection";
import { formatCurrency, getDayLabel } from "@/lib/utils";
import { cn } from "@/lib/utils/cn";

interface DayCardProps {
  day: GeneratedDay;
  defaultExpanded?: boolean;
  globalIndex?: number;
}

export function DayCard({ day, defaultExpanded = false, globalIndex = 0 }: DayCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);

  // Gradient per day cycling through palette
  const gradients = [
    "from-[#d4a853]/20 to-[#e2714b]/10",
    "from-violet-500/15 to-[#d4a853]/10",
    "from-emerald-500/15 to-teal-500/10",
    "from-blue-500/15 to-violet-500/10",
    "from-rose-500/15 to-[#e2714b]/10",
    "from-amber-500/15 to-yellow-500/10",
    "from-teal-500/15 to-blue-500/10",
  ];
  const gradient = gradients[globalIndex % gradients.length];

  return (
    <article
      className={cn(
        "relative glass rounded-3xl border overflow-hidden",
        "transition-all duration-400 ease-out",
        "animate-fade-up opacity-0",
        expanded ? "border-[#d4a853]/25 shadow-xl shadow-black/30" : "border-white/10 hover:border-white/18"
      )}
      style={{ animationDelay: `${globalIndex * 100}ms`, animationFillMode: "forwards" }}
    >
      {/* Day indicator stripe */}
      {expanded && (
        <div className={cn("h-0.5 w-full bg-gradient-to-r", gradient, "transition-all duration-500")} />
      )}

      {/* Header toggle */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`day-${day.dayNumber}-content`}
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-6 py-5 flex items-center gap-4 group text-left relative"
      >
        {/* Day badge */}
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0",
            "transition-all duration-400",
            expanded
              ? "bg-gradient-to-br from-[#d4a853] to-[#e2714b] shadow-lg shadow-[#d4a853]/30 scale-105"
              : "glass border border-white/12 group-hover:border-[#d4a853]/30"
          )}
        >
          <span className={cn("text-[10px] font-bold uppercase leading-none", expanded ? "text-white/80" : "text-white/35")}>Day</span>
          <span className={cn("text-xl font-bold leading-none", expanded ? "text-white" : "text-white/70")}>{day.dayNumber}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-display text-lg font-semibold leading-tight transition-colors duration-200",
            expanded ? "text-[#d4a853]" : "text-white group-hover:text-[#d4a853]/80"
          )}>
            {day.theme}
          </h3>
          <p className="text-white/35 text-sm mt-0.5">{getDayLabel(day.date)}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Cost — hidden on small screens */}
          <div className="text-right hidden sm:block">
            <p className="text-[#d4a853] font-semibold text-sm">{formatCurrency(day.estimatedCost)}</p>
            <p className="text-white/25 text-xs">est. cost</p>
          </div>

          {/* Activity count pills */}
          <div className="hidden md:flex items-center gap-1.5">
            <CountPill count={day.activities.length} icon="🎯" />
            <CountPill count={day.meals.length}      icon="🍽️" />
          </div>

          {/* Chevron */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            "glass border border-white/10 text-white/40",
            "transition-all duration-400 group-hover:border-white/20",
            expanded && "rotate-180 border-[#d4a853]/30 text-[#d4a853]/70"
          )}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M2 3.5L5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </button>

      {/* Collapsible body */}
      {expanded && (
        <div
          id={`day-${day.dayNumber}-content`}
          ref={contentRef}
          className="px-6 pb-7 space-y-7 border-t border-white/6"
        >
          {/* Day summary */}
          <blockquote className="text-white/55 text-sm leading-relaxed italic mt-6 pl-4 border-l-2 border-[#d4a853]/30">
            {day.summary}
          </blockquote>

          {/* Activities */}
          {day.activities.length > 0 && (
            <section>
              <SectionHeader icon="🎯" label="Activities & Sights" count={day.activities.length} />
              <div className="space-y-3 mt-3">
                {day.activities.map((a, i) => (
                  <ActivityCard key={a.id} activity={a} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Meals */}
          {day.meals.length > 0 && (
            <section>
              <SectionHeader icon="🍽️" label="Dining" count={day.meals.length} />
              <div className="space-y-3 mt-3">
                {day.meals.map((m, i) => (
                  <MealCard key={m.id} meal={m} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Transport */}
          {day.transport.length > 0 && (
            <section>
              <SectionHeader icon="🚦" label="Getting around" count={day.transport.length} />
              <div className="mt-3">
                <TransportSection transport={day.transport} />
              </div>
            </section>
          )}

          {/* Mobile cost */}
          <div className="sm:hidden flex items-center justify-between glass rounded-xl px-4 py-3 border border-white/8">
            <span className="text-white/45 text-sm">Today's cost</span>
            <span className="text-[#d4a853] font-semibold">{formatCurrency(day.estimatedCost)}</span>
          </div>
        </div>
      )}
    </article>
  );
}

function SectionHeader({ icon, label, count }: { icon: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base" aria-hidden>{icon}</span>
      <span className="text-white/50 text-xs uppercase tracking-wider font-semibold">{label}</span>
      <span className="text-white/20 text-xs">({count})</span>
    </div>
  );
}

function CountPill({ count, icon }: { count: number; icon: string }) {
  return (
    <div className="flex items-center gap-1 glass border border-white/8 rounded-full px-2 py-0.5 text-xs text-white/40">
      <span className="text-[11px]">{icon}</span>
      {count}
    </div>
  );
}
