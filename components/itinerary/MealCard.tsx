"use client";
// components/itinerary/MealCard.tsx — Premium meal card with star rating and tip reveal

import { useState } from "react";
import type { GeneratedMeal } from "@/types";
import { formatCurrency } from "@/lib/utils/currency";
import { MEAL_TYPE_ICONS, PRICE_RANGE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

interface MealCardProps {
  meal: GeneratedMeal;
  index?: number;
}

export function MealCard({ meal, index = 0 }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const mealIcon = MEAL_TYPE_ICONS[meal.type] ?? "🍴";

  // Star rating display
  const stars = meal.rating ? Math.round(meal.rating * 2) / 2 : null;

  return (
    <div
      className={cn(
        "group glass rounded-2xl border border-white/8 overflow-hidden",
        "transition-all duration-300 hover:border-[#e2714b]/20 hover:shadow-lg hover:shadow-black/30",
        "animate-fade-up opacity-0"
      )}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "forwards" }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-3.5">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-xl flex-shrink-0
                          group-hover:border-[#e2714b]/20 transition-colors duration-300">
            {mealIcon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-white/35 text-xs uppercase tracking-wider font-medium">{meal.type}</span>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-white/35 text-xs">{meal.cuisine}</span>
                </div>
                <h4 className="text-white font-semibold text-base leading-tight">{meal.name}</h4>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-semibold",
                    meal.priceRange === "$$$$" ? "text-violet-400" :
                    meal.priceRange === "$$$"  ? "text-amber-400" :
                    meal.priceRange === "$$"   ? "text-[#d4a853]" : "text-emerald-400"
                  )}>
                    {meal.priceRange}
                  </p>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 transition-all duration-300 flex-shrink-0",
                  expanded && "rotate-180"
                )}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 3L4 5.5 6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Rating + cost row */}
            <div className="flex items-center gap-3 mt-2">
              {stars && (
                <div className="flex items-center gap-1">
                  <StarRating rating={stars} />
                  <span className="text-white/35 text-xs">{meal.rating?.toFixed(1)}</span>
                </div>
              )}
              <span className="text-[#d4a853] text-xs font-medium">
                ~{formatCurrency(meal.cost)} /person
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3 animate-fade-up border-t border-white/5 pt-4" style={{ animationFillMode: "forwards" }}>
          <p className="text-white/55 text-sm leading-relaxed">{meal.description}</p>

          {meal.address && (
            <div className="flex items-center gap-1.5 text-white/30 text-xs">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M5 1C3.34 1 2 2.34 2 4c0 2.5 3 5 3 5s3-2.5 3-5c0-1.66-1.34-3-3-3zm0 4a1 1 0 110-2 1 1 0 010 2z" fill="currentColor"/>
              </svg>
              {meal.address}
            </div>
          )}

          {meal.tips && (
            <div className="rounded-xl bg-[#e2714b]/8 border border-[#e2714b]/15 px-4 py-3">
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0">🍷</span>
                <p className="text-[#f0a07a]/80 text-xs leading-relaxed">
                  <span className="font-semibold">Tip: </span>{meal.tips}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i + 1 <= Math.floor(rating);
        const half   = !filled && i + 0.5 <= rating;
        return (
          <svg key={i} width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 1l1.12 2.27L9 3.64l-2 1.95.47 2.75L5 7.06 2.53 8.34 3 5.59 1 3.64l2.88-.37L5 1z"
              fill={filled ? "#d4a853" : half ? "url(#half)" : "none"}
              stroke={filled || half ? "#d4a853" : "rgba(255,255,255,0.15)"}
              strokeWidth="0.5"
            />
            {half && (
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="#d4a853" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
          </svg>
        );
      })}
    </div>
  );
}
