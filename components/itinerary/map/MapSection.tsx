"use client";
// components/itinerary/map/MapSection.tsx
// ─── Map Section ──────────────────────────────────────────────────────────────
// Owns the selected-day state and composes the map + day selector.

import { useState } from "react";
import type { GeneratedDay } from "@/types";
import { InteractiveMap } from "./InteractiveMap";
import { DaySelector } from "./DaySelector";

interface MapSectionProps {
  days: GeneratedDay[];
  destination: string;
  centerLat?: number;
  centerLng?: number;
}

export function MapSection({ days, destination, centerLat, centerLng }: MapSectionProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-white font-semibold text-base flex items-center gap-2">
          <span aria-hidden="true">📍</span> Locations
        </h3>
        {days.length > 1 && (
          <DaySelector
            days={days}
            selectedDay={selectedDay}
            onSelect={setSelectedDay}
          />
        )}
      </div>

      <InteractiveMap
        days={days}
        destination={destination}
        centerLat={centerLat}
        centerLng={centerLng}
        selectedDay={selectedDay}
      />
    </div>
  );
}
