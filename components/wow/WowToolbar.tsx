"use client";
// components/wow/WowToolbar.tsx
// ─── Wow Features Toolbar ────────────────────────────────────────────────────
// A floating action bar on the itinerary page. Each button opens the relevant
// feature in a bottom sheet modal. The chat is handled separately (always visible).

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { ReplanPanel }      from "./ReplanPanel";
import { BudgetOptimizer }  from "./BudgetOptimizer";
import { RouteOptimizer }   from "./RouteOptimizer";
import { HiddenGems }       from "./HiddenGems";

type ActiveFeature = "replan" | "budget" | "route" | "gems" | null;

const FEATURES = [
  { id: "replan"  as const, icon: "🔄", label: "Replan",         sublabel: "Adapt to changes"  },
  { id: "budget"  as const, icon: "💰", label: "Save budget",    sublabel: "Cut costs smartly" },
  { id: "route"   as const, icon: "🗺️", label: "Fix routes",     sublabel: "Stop backtracking" },
  { id: "gems"    as const, icon: "💎", label: "Hidden gems",    sublabel: "Local secrets"     },
];

export function WowToolbar() {
  const [active, setActive]   = useState<ActiveFeature>(null);
  const [visible, setVisible] = useState(false);

  // Entrance animation after page load
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  function open(feature: ActiveFeature)  { setActive(feature); }
  function close()                        { setActive(null); }

  return (
    <>
      {/* Floating toolbar */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-out",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
        style={{ right: "6rem" }} // leave room for chat button
      >
        <div className="glass rounded-2xl border border-white/12 px-3 py-2.5 flex items-center gap-1 shadow-2xl shadow-black/50">
          {/* Label */}
          <span className="text-white/25 text-xs font-medium mr-2 hidden sm:block">AI Tools</span>

          {FEATURES.map((feature, i) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => open(feature.id)}
              className={cn(
                "group flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200",
                "hover:bg-white/8 hover:-translate-y-0.5",
                active === feature.id && "bg-[#d4a853]/12 border border-[#d4a853]/25"
              )}
              title={`${feature.label} — ${feature.sublabel}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </span>
              <span className={cn(
                "text-[10px] font-medium hidden sm:block transition-colors",
                active === feature.id ? "text-[#d4a853]" : "text-white/40 group-hover:text-white/70"
              )}>
                {feature.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature modal sheet */}
      {active && (
        <FeatureSheet feature={active} onClose={close} />
      )}
    </>
  );
}

function FeatureSheet({ feature, onClose }: { feature: NonNullable<ActiveFeature>; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const titles: Record<NonNullable<ActiveFeature>, { icon: string; title: string; subtitle: string }> = {
    replan: { icon: "🔄", title: "Replan Itinerary",    subtitle: "Adapt your trip to any situation"     },
    budget: { icon: "💰", title: "Budget Optimizer",    subtitle: "Reduce costs without losing quality"  },
    route:  { icon: "🗺️", title: "Route Optimizer",     subtitle: "Eliminate backtracking from your days"},
    gems:   { icon: "💎", title: "Hidden Gems",          subtitle: "Local secrets tourists never find"   },
  };

  const meta = titles[feature];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          mounted ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "relative w-full sm:max-w-lg glass border border-white/12 rounded-t-3xl sm:rounded-3xl",
          "p-6 sm:p-8 max-h-[90vh] overflow-y-auto",
          "transition-all duration-400 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-100 translate-y-8"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d4a853]/20 to-[#e2714b]/10 border border-[#d4a853]/20 flex items-center justify-center text-2xl">
              {meta.icon}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">{meta.title}</h2>
              <p className="text-white/40 text-xs mt-0.5">{meta.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Feature content */}
        {feature === "replan" && <ReplanPanel     onClose={onClose} onComplete={() => {}} />}
        {feature === "budget" && <BudgetOptimizer onClose={onClose} />}
        {feature === "route"  && <RouteOptimizer  onClose={onClose} />}
        {feature === "gems"   && <HiddenGems      onClose={onClose} />}
      </div>
    </div>
  );
}
