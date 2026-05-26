"use client";
// components/planner/Step1Destination.tsx

import { usePlannerStore, selectInputs } from "@/lib/store/planner.store";

const POPULAR_DESTINATIONS = [
  "Paris", "Tokyo", "Barcelona", "Bali",
  "New York", "Rome", "Istanbul", "Marrakech",
];

export function Step1Destination() {
  const inputs = usePlannerStore(selectInputs);
  const patchInputs = usePlannerStore((s) => s.patchInputs);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
          Where are you headed?
        </h2>
        <p className="text-white/45 text-base">
          Enter your destination and travel dates to get started.
        </p>
      </div>

      {/* Destination */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/70">
          Destination
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">🌍</span>
          <input
            type="text"
            placeholder="City, country, or region..."
            value={inputs.destination ?? ""}
            onChange={(e) => patchInputs({ destination: e.target.value })}
            className="input-glass w-full pl-12 pr-4 py-4 rounded-xl text-base"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest}
              type="button"
              onClick={() => patchInputs({ destination: dest })}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                inputs.destination === dest
                  ? "bg-[#d4a853]/20 border-[#d4a853]/50 text-[#d4a853]"
                  : "glass border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
              }`}
            >
              {dest}
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/70">Departure</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">📅</span>
            <input
              type="date"
              value={inputs.startDate ?? ""}
              min={today}
              onChange={(e) => patchInputs({ startDate: e.target.value })}
              className="input-glass w-full pl-12 pr-4 py-4 rounded-xl text-base [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/70">Return</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">📅</span>
            <input
              type="date"
              value={inputs.endDate ?? ""}
              min={inputs.startDate ?? today}
              onChange={(e) => patchInputs({ endDate: e.target.value })}
              className="input-glass w-full pl-12 pr-4 py-4 rounded-xl text-base [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Duration pill */}
      {inputs.startDate && inputs.endDate && inputs.endDate >= inputs.startDate && (
        <div className="glass rounded-xl p-4 border border-[#d4a853]/20 flex items-center gap-3">
          <span className="text-2xl">🗓️</span>
          <div>
            <p className="text-[#d4a853] font-semibold">
              {Math.max(
                1,
                Math.round(
                  (new Date(inputs.endDate).getTime() -
                    new Date(inputs.startDate).getTime()) /
                    86_400_000
                ) + 1
              )}{" "}
              days
            </p>
            <p className="text-white/40 text-sm">
              Your AI itinerary will cover every day
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
