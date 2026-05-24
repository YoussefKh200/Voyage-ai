"use client";
// components/itinerary/ActivityCard.tsx — Premium activity card with micro-interactions

import { useState } from "react";
import type { GeneratedActivity } from "@/types";
import { formatTime, minutesToHours, formatCurrency } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

const DEFAULT_CATEGORY_CLASS = "bg-white/10 text-white/70 border-white/20";

interface ActivityCardProps {
  activity: GeneratedActivity;
  index?: number;
}

export function ActivityCard({ activity, index = 0 }: ActivityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tipped,   setTipped]   = useState(false);

  const categoryClass = CATEGORY_COLORS[activity.category] ?? DEFAULT_CATEGORY_CLASS;
  const costLabel = activity.cost === 0 ? "Free" : `${formatCurrency(activity.cost)} /person`;

  return (
    <div
      className={cn(
        "group relative glass rounded-2xl border border-white/8 overflow-hidden",
        "transition-all duration-300 hover:border-[#d4a853]/20 hover:shadow-xl hover:shadow-black/30",
        "animate-fade-up opacity-0"
      )}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "forwards" }}
    >
      {/* Hover shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent
                      -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex gap-4"
        aria-expanded={expanded}
      >
        {/* Time column */}
        <div className="flex-shrink-0 text-right w-[60px]">
          <p className="text-[#d4a853] text-sm font-semibold leading-tight">
            {formatTime(activity.startTime)}
          </p>
          <p className="text-white/30 text-xs mt-0.5">{minutesToHours(activity.duration)}</p>
        </div>

        {/* Timeline dot */}
        <div className="flex flex-col items-center flex-shrink-0 pt-1">
          <div className="timeline-dot" aria-hidden="true" />
          {expanded && <div className="w-px flex-1 mt-2 bg-[#d4a853]/20" />}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-white font-semibold text-base leading-snug pr-2">{activity.name}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium capitalize hidden sm:inline-flex", categoryClass)}>
                {activity.category}
              </span>
              {/* Expand chevron */}
              <div className={cn("w-5 h-5 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 transition-all duration-300 flex-shrink-0", expanded && "rotate-180")}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 3L4 5.5 6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

          {!expanded && (
            <p className="text-white/45 text-sm mt-1.5 line-clamp-1 leading-relaxed">
              {activity.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {activity.address && (
              <span className="text-white/30 text-xs flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path d="M5 1C3.34 1 2 2.34 2 4c0 2.5 3 5 3 5s3-2.5 3-5c0-1.66-1.34-3-3-3zm0 4a1 1 0 110-2 1 1 0 010 2z" fill="currentColor"/>
                </svg>
                <span className="truncate max-w-[180px]">{activity.address}</span>
              </span>
            )}
            <span className={cn("text-xs font-semibold", activity.cost === 0 ? "text-emerald-400" : "text-[#d4a853]")}>
              {costLabel}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 pl-[calc(60px+24px+20px)] space-y-3 animate-fade-up" style={{ animationFillMode: "forwards" }}>
          <p className="text-white/60 text-sm leading-relaxed">{activity.description}</p>

          {activity.tips && (
            <button
              type="button"
              onClick={() => setTipped(!tipped)}
              className={cn(
                "w-full text-left rounded-xl px-4 py-3 border transition-all duration-200",
                tipped
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "glass border-amber-500/15 hover:bg-amber-500/8"
              )}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0">💡</span>
                <div>
                  <p className="text-amber-300/80 text-xs font-semibold mb-0.5">Insider tip</p>
                  <p className="text-amber-200/60 text-xs leading-relaxed">{activity.tips}</p>
                </div>
              </div>
            </button>
          )}

          {activity.lat && activity.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-[#d4a853] transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M8.5 1.5l-4 4M8.5 1.5H5.5M8.5 1.5v3M4 3H2a.5.5 0 00-.5.5v5A.5.5 0 002 9h5a.5.5 0 00.5-.5V6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Open in Maps
            </a>
          )}
        </div>
      )}
    </div>
  );
}
