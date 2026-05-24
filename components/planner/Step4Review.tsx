"use client";
// components/planner/Step4Review.tsx — Polished review + generate button

import { usePlannerStore, selectInputs, selectError } from "@/lib/store/planner.store";
import { useGenerateItinerary } from "@/lib/hooks/useGenerateItinerary";
import { INTERESTS, TRAVEL_STYLES } from "@/lib/constants";
import { formatDate, getTripDuration, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils/cn";

export function Step4Review() {
  const inputs = usePlannerStore(selectInputs);
  const error  = usePlannerStore(selectError);
  const { generate, isGenerating } = useGenerateItinerary();

  const duration = inputs.startDate && inputs.endDate
    ? getTripDuration(inputs.startDate, inputs.endDate) : 0;
  const selectedStyle     = TRAVEL_STYLES.find((s) => s.value === inputs.travelStyle);
  const selectedInterests = (inputs.interests ?? [])
    .map((i) => INTERESTS.find((int) => int.value === i))
    .filter(Boolean);

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">Ready to generate?</h2>
        <p className="text-white/40 text-base">Our AI will craft your personalised itinerary in seconds.</p>
      </div>

      {/* Destination hero */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="bg-gradient-to-r from-[#d4a853]/15 to-[#e2714b]/8 px-6 py-5 border-b border-white/8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4a853]/20 to-[#e2714b]/10 border border-[#d4a853]/20 flex items-center justify-center text-2xl flex-shrink-0">
              🌍
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-white">{inputs.destination || "—"}</h3>
              <p className="text-white/40 text-sm mt-0.5">
                {inputs.startDate && formatDate(inputs.startDate)} → {inputs.endDate && formatDate(inputs.endDate)} · {duration} days
              </p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
          {[
            { icon: "💰", label: "Budget",      value: inputs.budget ? formatCurrency(inputs.budget) : "—" },
            { icon: "👤", label: "Travelers",   value: inputs.travelers ? `${inputs.travelers} ${inputs.travelers === 1 ? "person" : "people"}` : "—" },
            { icon: selectedStyle?.icon ?? "🧳", label: "Style", value: selectedStyle?.label ?? "—" },
            { icon: "📅", label: "Duration",    value: `${duration} ${duration === 1 ? "day" : "days"}` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="px-5 py-4">
              <p className="text-white/30 text-[11px] mb-1">{label}</p>
              <p className="text-white font-medium text-sm flex items-center gap-1.5">
                <span>{icon}</span>{value}
              </p>
            </div>
          ))}
        </div>

        {/* Interests */}
        {selectedInterests.length > 0 && (
          <div className="px-6 py-4 border-t border-white/6">
            <p className="text-white/25 text-[11px] uppercase tracking-wider mb-2.5">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedInterests.map((interest) =>
                interest ? (
                  <span key={interest.value} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#d4a853]/10 border border-[#d4a853]/20 text-[#d4a853]">
                    <span>{interest.icon}</span>{interest.label}
                  </span>
                ) : null
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="glass rounded-xl p-4 border border-rose-500/25 bg-rose-500/5 animate-fade-up" style={{ animationFillMode: "forwards" }}>
          <p className="text-rose-400 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7 4v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={generate}
        disabled={isGenerating}
        className={cn(
          "w-full py-5 rounded-2xl text-base font-semibold flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden",
          isGenerating
            ? "glass border border-white/10 text-white/30 cursor-not-allowed"
            : "btn-primary shadow-xl shadow-[#d4a853]/20"
        )}
      >
        {isGenerating ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-white/15 border-t-white/60 animate-spin flex-shrink-0" />
            <span>Starting your journey…</span>
          </>
        ) : (
          <>
            <span className="text-lg" aria-hidden>✨</span>
            <span>Generate my itinerary</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </button>

      <p className="text-center text-white/20 text-xs">Takes 15–30 seconds · Powered by GPT-4o</p>
    </div>
  );
}
