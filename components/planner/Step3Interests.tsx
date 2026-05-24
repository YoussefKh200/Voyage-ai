"use client";
// components/planner/Step3Interests.tsx — Animated interest chips with spring selection

import { usePlannerStore, selectInputs } from "@/lib/store/planner.store";
import { INTERESTS } from "@/lib/constants";
import type { Interest } from "@/types";
import { cn } from "@/lib/utils/cn";

export function Step3Interests() {
  const inputs       = usePlannerStore(selectInputs);
  const toggleInterest = usePlannerStore((s) => s.toggleInterest);
  const selected     = inputs.interests ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
          What excites you most?
        </h2>
        <p className="text-white/45 text-base">
          Select everything that matters — the more you pick, the better your itinerary.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5">
          {INTERESTS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-400",
                i < selected.length
                  ? "bg-gradient-to-r from-[#d4a853] to-[#e2714b] w-5"
                  : "bg-white/15 w-1.5"
              )}
            />
          ))}
        </div>
        <span className="text-white/35 text-sm ml-1">
          {selected.length === 0 ? "Choose at least one" : `${selected.length} selected`}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {INTERESTS.map((interest, i) => {
          const isSelected = selected.includes(interest.value as Interest);
          return (
            <button
              key={interest.value}
              type="button"
              onClick={() => toggleInterest(interest.value as Interest)}
              className={cn(
                "interest-chip p-4 rounded-2xl border text-left relative overflow-hidden group",
                "animate-fade-up opacity-0",
                isSelected
                  ? "border-[#d4a853]/50 bg-[#d4a853]/10 selected"
                  : "glass border-white/8 hover:border-white/20 hover:bg-white/5"
              )}
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "forwards" }}
            >
              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#d4a853] flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              <div
                className="text-3xl mb-2.5 transition-transform duration-300 group-hover:scale-110 inline-block"
                style={{ filter: isSelected ? "drop-shadow(0 0 8px rgba(212,168,83,0.5))" : "none" }}
              >
                {interest.icon}
              </div>
              <div className={cn("text-sm font-semibold mb-0.5 transition-colors", isSelected ? "text-[#d4a853]" : "text-white")}>
                {interest.label}
              </div>
              <div className="text-xs text-white/35 leading-tight">{interest.description}</div>
            </button>
          );
        })}
      </div>

      {/* Selection summary */}
      {selected.length > 0 && (
        <div
          className="glass rounded-xl p-3.5 border border-[#d4a853]/15 animate-fade-up"
          style={{ animationFillMode: "forwards" }}
        >
          <p className="text-sm text-white/55">
            <span className="text-[#d4a853] font-medium">Your focus: </span>
            {selected
              .map((s) => INTERESTS.find((i) => i.value === s)?.label)
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
