"use client";
// components/itinerary/CostBreakdown.tsx — Animated cost breakdown with progress bars

import { useEffect, useState } from "react";
import type { GeneratedItinerary } from "@/types";
import { formatCurrency } from "@/lib/utils/currency";
import { useItineraryCosts } from "@/lib/hooks/useItineraryCosts";

interface CostBreakdownProps {
  itinerary: GeneratedItinerary;
  travelers: number;
}

export function CostBreakdown({ itinerary, travelers }: CostBreakdownProps) {
  const costs = useItineraryCosts(itinerary, travelers);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const categories = [
    { label: "Activities",  value: costs.activities,  icon: "🎯", color: "from-violet-500 to-violet-400" },
    { label: "Dining",      value: costs.meals,        icon: "🍽️", color: "from-[#e2714b] to-[#f0a07a]" },
    { label: "Transport",   value: costs.transport,    icon: "🚗", color: "from-blue-500 to-blue-400" },
  ] as const;

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <span aria-hidden="true">💰</span> Budget Breakdown
        </h3>
        <span className="text-[#d4a853] font-bold text-base">{formatCurrency(costs.total)}</span>
      </div>

      {/* Stacked bar */}
      <div className="h-2 rounded-full overflow-hidden bg-white/6 flex" role="img" aria-label="Budget distribution">
        {categories.map(({ label, value, color }, i) => {
          const pct = costs.total > 0 ? (value / costs.total) * 100 : 0;
          return (
            <div
              key={label}
              className={`h-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
              style={{
                width: animated ? `${pct}%` : "0%",
                transitionDelay: `${i * 100}ms`,
              }}
              title={`${label}: ${formatCurrency(value)}`}
            />
          );
        })}
      </div>

      {/* Category rows */}
      <div className="space-y-4">
        {categories.map(({ label, value, icon, color }, i) => {
          const pct = costs.total > 0 ? (value / costs.total) * 100 : 0;
          return (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-white/55 text-xs flex items-center gap-1.5">
                  <span aria-hidden>{icon}</span> {label}
                </span>
                <span className="text-white/80 text-xs font-semibold">{formatCurrency(value)}</span>
              </div>
              {/* Track */}
              <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
                  style={{
                    width: animated ? `${pct}%` : "0%",
                    transitionDelay: `${(i + 1) * 120}ms`,
                  }}
                  role="progressbar"
                  aria-valuenow={Math.round(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-t border-white/8 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-white/40">Grand total</span>
          <span className="text-[#d4a853] font-bold">{formatCurrency(costs.total)}</span>
        </div>
        {travelers > 1 && (
          <div className="flex justify-between text-xs">
            <span className="text-white/30">Per person ({travelers} travelers)</span>
            <span className="text-white/60 font-semibold">{formatCurrency(costs.perPerson)}</span>
          </div>
        )}
      </div>

      {/* Daily average */}
      {itinerary.days.length > 0 && (
        <div className="glass-gold rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-white/45 text-xs">Daily average</span>
          <span className="text-[#d4a853] font-semibold text-sm">
            {formatCurrency(Math.round(costs.total / itinerary.days.length))}
            <span className="text-white/30 font-normal text-xs"> / day</span>
          </span>
        </div>
      )}
    </div>
  );
}
