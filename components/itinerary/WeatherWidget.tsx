"use client";
// components/itinerary/WeatherWidget.tsx
// ─── Trip Weather Forecast ────────────────────────────────────────────────────
// Shows a compact day-by-day weather forecast for the trip duration.
// Gracefully degrades with a skeleton while loading and a soft error state.

import { useWeather } from "@/lib/hooks/useWeather";
import type { DailyWeather } from "@/lib/external/weather/types";
import { cn } from "@/lib/utils/cn";

interface WeatherWidgetProps {
  destination: string;
  startDate: string;
  endDate: string;
  lat?: number;
  lng?: number;
}

export function WeatherWidget({
  destination,
  startDate,
  endDate,
  lat,
  lng,
}: WeatherWidgetProps) {
  const { isLoading, isSuccess, isError, data } = useWeather({
    destination,
    startDate,
    endDate,
    lat,
    lng,
  });

  return (
    <div className="glass rounded-2xl border border-white/10 p-6">
      <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
        <span aria-hidden="true">🌤️</span> Trip Weather
        {data?.source && (
          <span className="ml-auto text-[10px] text-white/25 font-normal">
            open-meteo
          </span>
        )}
      </h3>

      {isLoading && <WeatherSkeleton />}

      {isError && (
        <p className="text-white/35 text-xs text-center py-3">
          Weather unavailable for this destination
        </p>
      )}

      {isSuccess && data && (
        <div className="space-y-1.5">
          {data.days.slice(0, 7).map((day) => (
            <WeatherDayRow key={day.date} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}

function WeatherDayRow({ day }: { day: DailyWeather }) {
  const date = new Date(day.date + "T12:00:00");
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const rainBadge =
    day.precipitationProbability > 20 ? (
      <span className="text-blue-400/70 text-[10px]">
        {day.precipitationProbability}%
      </span>
    ) : null;

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="w-16 flex-shrink-0">
        <p className="text-white/70 text-xs font-medium">{dayName}</p>
        <p className="text-white/35 text-[10px]">{monthDay}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-lg" title={day.description} aria-label={day.description}>
          {day.icon}
        </span>
        {rainBadge}
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-white/80 font-medium">{day.tempMaxC}°</span>
        <span className="text-white/30">/</span>
        <span className="text-white/45">{day.tempMinC}°</span>
      </div>

      {/* Wind indicator — only show if significant */}
      {day.windSpeedKph > 30 && (
        <span
          className="text-[10px] text-amber-400/70"
          title={`Wind: ${day.windSpeedKph} km/h`}
        >
          💨
        </span>
      )}
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading weather">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="skeleton h-9 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ─── Compact inline badge for DayCard ────────────────────────────────────────
// A tiny weather chip shown next to each day's theme in the itinerary.

interface WeatherBadgeProps {
  day: DailyWeather;
  className?: string;
}

export function WeatherBadge({ day, className }: WeatherBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
        "bg-white/5 border border-white/10 text-white/50",
        className
      )}
      title={`${day.description}, ${day.tempMinC}–${day.tempMaxC}°C`}
    >
      <span aria-hidden="true">{day.icon}</span>
      {day.tempMaxC}°C
    </span>
  );
}
