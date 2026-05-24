"use client";
// components/wow/HiddenGems.tsx — Local hidden gems discovery

import { useState } from "react";
import { useWowStore } from "@/lib/store/wow.store";
import { usePlannerStore, selectItinerary, selectInputs } from "@/lib/store/planner.store";
import { formatCurrency } from "@/lib/utils/currency";
import type { HiddenGem, GemCategory } from "@/types";
import { cn } from "@/lib/utils/cn";

const CATEGORY_ICONS: Record<GemCategory, string> = {
  restaurant:   "🍽️",
  bar:          "🍷",
  viewpoint:    "🌅",
  market:       "🛒",
  neighbourhood:"🏘️",
  experience:   "✨",
  nature:       "🌿",
  cultural:     "🏛️",
};

const CATEGORY_COLORS: Record<GemCategory, string> = {
  restaurant:   "border-orange-500/25 bg-orange-500/8",
  bar:          "border-violet-500/25 bg-violet-500/8",
  viewpoint:    "border-amber-500/25 bg-amber-500/8",
  market:       "border-emerald-500/25 bg-emerald-500/8",
  neighbourhood:"border-blue-500/25 bg-blue-500/8",
  experience:   "border-[#d4a853]/25 bg-[#d4a853]/8",
  nature:       "border-teal-500/25 bg-teal-500/8",
  cultural:     "border-rose-500/25 bg-rose-500/8",
};

interface HiddenGemsProps {
  onClose: () => void;
}

export function HiddenGems({ onClose }: HiddenGemsProps) {
  const itinerary    = usePlannerStore(selectItinerary);
  const inputs       = usePlannerStore(selectInputs);
  const { isLoadingGems, gemsResult, gemsError, setLoadingGems, setGemsResult, setGemsError } = useWowStore();

  const [filter, setFilter] = useState<GemCategory | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!itinerary || !inputs) return null;

  async function loadGems() {
    if (isLoadingGems) return;
    setLoadingGems(true);
    setGemsError(null);

    try {
      const res = await fetch("/api/gems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: itinerary!.destination,
          interests: inputs.interests ?? ["food", "culture"],
          travelStyle: inputs.travelStyle ?? "comfort",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to load gems");
      setGemsResult(json.data);
    } catch (err) {
      setGemsError(err instanceof Error ? err.message : "Failed to load gems.");
    } finally {
      setLoadingGems(false);
    }
  }

  const gems = gemsResult?.gems ?? [];
  const filtered = filter === "all" ? gems : gems.filter((g) => g.category === filter);
  const categories = [...new Set(gems.map((g) => g.category))] as GemCategory[];

  if (!gemsResult && !isLoadingGems) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4 space-y-4">
          <div className="text-5xl">💎</div>
          <div>
            <h3 className="font-display text-xl font-bold text-white mb-2">
              Discover local secrets in {itinerary.destination}
            </h3>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
              8 genuine hidden gems — the spots locals love that never make it into travel guides.
            </p>
          </div>
        </div>

        {/* Preview grid */}
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(CATEGORY_ICONS).slice(0, 8).map(([cat, icon]) => (
            <div key={cat} className="glass rounded-xl p-3 border border-white/6 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-white/30 text-[10px] capitalize">{cat}</div>
            </div>
          ))}
        </div>

        {gemsError && (
          <div className="glass rounded-xl p-3 border border-rose-500/25 bg-rose-500/5">
            <p className="text-rose-400 text-xs">{gemsError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl glass border border-white/10 text-white/50 text-sm hover:text-white transition-all">
            Cancel
          </button>
          <button onClick={loadGems}
            className="flex-grow-[2] py-3 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2">
            💎 Find hidden gems
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingGems) {
    return (
      <div className="py-10 text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#d4a853]"
               style={{ animation: "rotateSlow 1.2s linear infinite" }} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">💎</div>
        </div>
        <div>
          <p className="text-white font-semibold">Consulting the locals…</p>
          <p className="text-white/35 text-sm mt-1">Finding spots tourists never discover</p>
        </div>
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#d4a853]/60"
                 style={{ animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setFilter("all")}
          className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            filter === "all" ? "bg-[#d4a853]/20 border border-[#d4a853]/40 text-[#d4a853]" : "glass border border-white/10 text-white/45 hover:text-white")}>
          All ({gems.length})
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={cn("flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
              filter === cat ? "bg-[#d4a853]/20 border border-[#d4a853]/40 text-[#d4a853]" : "glass border border-white/10 text-white/45 hover:text-white")}>
            <span>{CATEGORY_ICONS[cat]}</span>
            <span className="capitalize">{cat}</span>
          </button>
        ))}
      </div>

      {/* Gems list */}
      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
        {filtered.map((gem: HiddenGem, i: number) => (
          <GemCard
            key={gem.id}
            gem={gem}
            index={i}
            isExpanded={expanded === gem.id}
            onToggle={() => setExpanded(expanded === gem.id ? null : gem.id)}
          />
        ))}
      </div>

      <button onClick={() => { setGemsResult(null); }}
        className="w-full py-2.5 rounded-xl glass border border-white/10 text-white/40 text-xs hover:text-white transition-all">
        🔄 Rediscover gems
      </button>
    </div>
  );
}

function GemCard({ gem, index, isExpanded, onToggle }: {
  gem: HiddenGem;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const catColor = CATEGORY_COLORS[gem.category as GemCategory] ?? "border-white/10 bg-white/5";
  const catIcon  = CATEGORY_ICONS[gem.category as GemCategory] ?? "✨";

  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-300 overflow-hidden animate-fade-up opacity-0",
      isExpanded ? `${catColor} shadow-lg` : "glass border-white/8 hover:border-white/16"
    )}
    style={{ animationDelay: `${index * 60}ms`, animationFillMode: "forwards" }}>
      <button type="button" onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center text-lg flex-shrink-0", catColor)}>
            {catIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-white font-semibold text-sm leading-tight">{gem.name}</h4>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn("text-xs font-medium", gem.cost === 0 ? "text-emerald-400" : "text-[#d4a853]")}>
                  {gem.cost === 0 ? "Free" : formatCurrency(gem.cost)}
                </span>
                <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white/30 transition-transform duration-300", isExpanded && "rotate-180")}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 3L4 5.5 6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-white/40 text-xs mt-0.5 leading-relaxed line-clamp-1">{gem.description}</p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/6 pt-3 animate-fade-up" style={{ animationFillMode: "forwards" }}>
          <p className="text-white/55 text-sm leading-relaxed">{gem.description}</p>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="glass rounded-xl p-3 border border-white/6">
              <p className="text-white/30 mb-1">Why it&apos;s hidden</p>
              <p className="text-white/60 leading-relaxed">{gem.why_hidden}</p>
            </div>
            <div className="glass rounded-xl p-3 border border-white/6">
              <p className="text-white/30 mb-1">Best time</p>
              <p className="text-white/60 leading-relaxed">{gem.best_time}</p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 px-3.5 py-3">
            <p className="text-amber-300/80 text-xs leading-relaxed">
              <span className="font-semibold">💡 Insider: </span>{gem.insider_tip}
            </p>
          </div>

          {gem.avoid_if && (
            <p className="text-white/25 text-xs italic">
              ⚠️ Skip if: {gem.avoid_if}
            </p>
          )}

          {gem.address && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gem.name + " " + gem.address)}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-[#d4a853] transition-colors">
              📍 {gem.address} ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
