"use client";
// components/wow/RouteOptimizer.tsx — Smart route optimization

import { useState } from "react";
import { useWowStore } from "@/lib/store/wow.store";
import { usePlannerStore, selectItinerary, selectInputs } from "@/lib/store/planner.store";
import { minutesToHours } from "@/lib/utils/time";
import type { RouteIssue } from "@/types";
import { cn } from "@/lib/utils/cn";

interface RouteOptimizerProps {
  onClose: () => void;
}

export function RouteOptimizer({ onClose }: RouteOptimizerProps) {
  const itinerary    = usePlannerStore(selectItinerary);
  const inputs       = usePlannerStore(selectInputs);
  const setItinerary = usePlannerStore((s) => s.setItinerary);
  const {
    isOptimizingRoute, routeResult, routeError,
    setOptimizingRoute, setRouteResult, setRouteError,
  } = useWowStore();

  const [applied, setApplied] = useState(false);

  if (!itinerary || !inputs) return null;

  async function handleOptimize() {
    if (isOptimizingRoute) return;
    setOptimizingRoute(true);
    setRouteError(null);

    try {
      const res = await fetch("/api/optimize/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary, inputs }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Optimization failed");
      setRouteResult(json.data);
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : "Failed. Please try again.");
    } finally {
      setOptimizingRoute(false);
    }
  }

  function applyRoute() {
    if (routeResult) {
      setItinerary(routeResult.itinerary);
      setApplied(true);
      setTimeout(onClose, 1200);
    }
  }

  if (applied) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-5xl">🗺️</div>
        <h3 className="font-display text-xl font-bold text-white">Routes optimised!</h3>
        <p className="text-white/40 text-sm">Closing…</p>
      </div>
    );
  }

  if (routeResult) {
    const saved = routeResult.minutesSaved;
    return (
      <div className="space-y-5">
        {/* Hero stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Wasted before",  value: minutesToHours(routeResult.totalWastedMinutesBefore), color: "text-rose-400" },
            { label: "Wasted after",   value: minutesToHours(routeResult.totalWastedMinutesAfter),  color: "text-amber-400" },
            { label: "Time saved",     value: minutesToHours(saved),                                color: "text-emerald-400" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-3 border border-white/8 text-center">
              <p className={cn("text-lg font-bold font-display", stat.color)}>{stat.value}</p>
              <p className="text-white/30 text-[11px] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Explanation */}
        {routeResult.explanation && (
          <div className="glass rounded-xl p-4 border border-blue-500/20 bg-blue-500/5">
            <p className="text-blue-300/80 text-sm leading-relaxed">💡 {routeResult.explanation}</p>
          </div>
        )}

        {/* Issues found */}
        {routeResult.issues.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-white/40 text-xs uppercase tracking-wider">Issues fixed</p>
            {routeResult.issues.map((issue: RouteIssue, i: number) => (
              <div key={i}
                className={cn(
                  "glass rounded-xl p-3.5 border flex gap-3 animate-fade-up opacity-0",
                  issue.severity === "major" ? "border-rose-500/20" : "border-amber-500/20"
                )}
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "forwards" }}
              >
                <span className="text-lg flex-shrink-0">
                  {issue.severity === "major" ? "🔴" : "🟡"}
                </span>
                <div className="min-w-0">
                  <p className="text-white/60 text-xs font-medium">Day {issue.dayNumber}</p>
                  <p className="text-white/45 text-xs leading-relaxed">{issue.description}</p>
                  <p className="text-emerald-400 text-xs font-medium mt-0.5">
                    Saves ~{minutesToHours(issue.wastedMinutes)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {saved === 0 && (
          <div className="glass rounded-xl p-4 border border-emerald-500/20 text-center">
            <p className="text-emerald-400 text-sm font-medium">✅ Your route is already well-optimised!</p>
            <p className="text-white/35 text-xs mt-1">No significant backtracking detected.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setRouteResult(null)}
            className="flex-1 py-3 rounded-xl glass border border-white/10 text-white/50 text-sm hover:text-white transition-all">
            Re-analyze
          </button>
          <button onClick={applyRoute}
            className="flex-grow-[2] py-3 rounded-xl btn-primary text-sm font-semibold">
            {saved > 0 ? `✅ Save ${minutesToHours(saved)}` : "✅ Confirm"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual preview */}
      <div className="glass rounded-2xl p-6 border border-white/8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 map-placeholder" />
        <div className="relative z-10 text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <h3 className="text-white font-semibold mb-1">Smart route analysis</h3>
          <p className="text-white/40 text-sm leading-relaxed">
            We&apos;ll analyze all {itinerary.days.length} days, detect backtracking, and
            reorder stops to minimize wasted travel time — without changing what you visit.
          </p>
        </div>
      </div>

      {/* Day pills preview */}
      <div className="grid grid-cols-2 gap-2">
        {itinerary.days.slice(0, 4).map((day) => (
          <div key={day.dayNumber} className="glass rounded-xl p-3 border border-white/8">
            <p className="text-white/50 text-xs font-medium mb-1">Day {day.dayNumber}</p>
            <p className="text-white/30 text-xs truncate">{day.activities.map((a) => a.name).join(" → ")}</p>
          </div>
        ))}
      </div>

      {routeError && (
        <div className="glass rounded-xl p-3 border border-rose-500/25 bg-rose-500/5">
          <p className="text-rose-400 text-xs">{routeError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-3 rounded-xl glass border border-white/10 text-white/50 text-sm hover:text-white transition-all">
          Cancel
        </button>
        <button onClick={handleOptimize} disabled={isOptimizingRoute}
          className={cn(
            "flex-grow-[2] py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
            !isOptimizingRoute ? "btn-primary" : "glass border border-white/8 text-white/25 cursor-not-allowed"
          )}>
          {isOptimizingRoute
            ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Analyzing routes…</>
            : "🗺️ Optimize my routes"}
        </button>
      </div>
    </div>
  );
}
