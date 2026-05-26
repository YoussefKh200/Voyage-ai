"use client";
// components/itinerary/map/DaySelector.tsx
// ─── Day Selector ─────────────────────────────────────────────────────────────
// Tab strip that filters the map to a single day's locations.

import { cn } from "@/lib/utils/cn";
import type { GeneratedDay } from "@/types";

interface DaySelectorProps {
  days: GeneratedDay[];
  selectedDay: number | null;
  onSelect: (day: number | null) => void;
}

export function DaySelector({ days, selectedDay, onSelect }: DaySelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label="Filter map by day">
      <button
        role="tab"
        aria-selected={selectedDay === null}
        onClick={() => onSelect(null)}
        className={cn(
          "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          selectedDay === null
            ? "bg-gradient-to-r from-[#d4a853] to-[#e2714b] text-white"
            : "glass border border-white/10 text-white/50 hover:text-white/80"
        )}
      >
        All days
      </button>

      {days.map((day) => (
        <button
          key={day.dayNumber}
          role="tab"
          aria-selected={selectedDay === day.dayNumber}
          onClick={() => onSelect(day.dayNumber)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            selectedDay === day.dayNumber
              ? "bg-gradient-to-r from-[#d4a853] to-[#e2714b] text-white"
              : "glass border border-white/10 text-white/50 hover:text-white/80"
          )}
          title={day.theme}
        >
          Day {day.dayNumber}
        </button>
      ))}
    </div>
  );
}
