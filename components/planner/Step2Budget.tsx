"use client";
// components/planner/Step2Budget.tsx

import { usePlannerStore, selectInputs } from "@/lib/store/planner.store";
import { TRAVEL_STYLES } from "@/lib/constants";
import type { TravelStyle } from "@/types";
import { cn } from "@/lib/utils";

const TRAVELER_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10] as const;
const BUDGET_PRESETS = [500, 1000, 2500, 5000, 10000] as const;

export function Step2Budget() {
  const inputs = usePlannerStore(selectInputs);
  const patchInputs = usePlannerStore((s) => s.patchInputs);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
          Budget & travel style
        </h2>
        <p className="text-white/45 text-base">
          We&apos;ll match every recommendation to what you can actually spend.
        </p>
      </div>

      {/* Budget */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/70">
          Total trip budget (USD)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-semibold pointer-events-none">
            $
          </span>
          <input
            type="number"
            placeholder="e.g. 3000"
            value={inputs.budget ?? ""}
            min={100}
            max={1_000_000}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val) && val >= 0) patchInputs({ budget: val });
            }}
            className="input-glass w-full pl-10 pr-4 py-4 rounded-xl text-base"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => patchInputs({ budget: value })}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-all ${
                inputs.budget === value
                  ? "bg-[#d4a853]/20 border-[#d4a853]/50 text-[#d4a853]"
                  : "glass border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
              }`}
            >
              ${value.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Travelers */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/70">
          Number of travelers
        </label>
        <div className="flex flex-wrap gap-3">
          {TRAVELER_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => patchInputs({ travelers: n })}
              className={cn(
                "w-12 h-12 rounded-xl border text-sm font-semibold transition-all",
                inputs.travelers === n
                  ? "bg-gradient-to-br from-[#d4a853] to-[#e2714b] border-transparent text-white shadow-lg"
                  : "glass border-white/10 text-white/50 hover:text-white hover:border-white/30"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Travel style */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/70">
          Travel style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TRAVEL_STYLES.map((style) => {
            const isSelected = inputs.travelStyle === style.value;
            return (
              <button
                key={style.value}
                type="button"
                onClick={() => patchInputs({ travelStyle: style.value as TravelStyle })}
                className={cn(
                  "p-5 rounded-2xl border text-left transition-all card-hover",
                  isSelected
                    ? "border-[#d4a853]/60 bg-[#d4a853]/10"
                    : "glass border-white/8 hover:border-white/20"
                )}
              >
                <div className="text-3xl mb-3">{style.icon}</div>
                <div className="text-base font-semibold text-white mb-1">
                  {style.label}
                </div>
                <div className="text-xs text-white/45 mb-2">{style.description}</div>
                <div
                  className={cn(
                    "text-xs font-medium",
                    isSelected ? "text-[#d4a853]" : "text-white/30"
                  )}
                >
                  {style.budgetHint}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
