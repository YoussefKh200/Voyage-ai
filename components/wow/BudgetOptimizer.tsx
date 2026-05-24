"use client";
// components/wow/BudgetOptimizer.tsx — "Reduce total cost by 20%"

import { useState } from "react";
import { useWowStore } from "@/lib/store/wow.store";
import { usePlannerStore, selectItinerary, selectInputs } from "@/lib/store/planner.store";
import { formatCurrency } from "@/lib/utils/currency";
import type { BudgetSaving } from "@/types";
import { cn } from "@/lib/utils/cn";

const REDUCTION_OPTIONS = [10, 15, 20, 25, 30] as const;

interface BudgetOptimizerProps {
  onClose: () => void;
}

export function BudgetOptimizer({ onClose }: BudgetOptimizerProps) {
  const itinerary   = usePlannerStore(selectItinerary);
  const inputs      = usePlannerStore(selectInputs);
  const setItinerary = usePlannerStore((s) => s.setItinerary);
  const { isOptimizing, optimizationResult, budgetError, setOptimizing, setOptimizationResult, setBudgetError } = useWowStore();

  const [targetPct, setTargetPct] = useState<number>(20);

  if (!itinerary || !inputs) return null;

  async function handleOptimize() {
    if (isOptimizing) return;
    setOptimizing(true);
    setBudgetError(null);

    try {
      const res = await fetch("/api/optimize/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary, inputs, targetReductionPercent: targetPct, priorities: [] }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Optimization failed");
      setOptimizationResult(json.data);
    } catch (err) {
      setBudgetError(err instanceof Error ? err.message : "Failed. Please try again.");
    } finally {
      setOptimizing(false);
    }
  }

  function applyOptimization() {
    if (optimizationResult) {
      setItinerary(optimizationResult.itinerary);
      setOptimizationResult(null);
      onClose();
    }
  }

  if (optimizationResult) {
    return (
      <div className="space-y-5">
        {/* Savings hero */}
        <div className="glass-gold rounded-2xl p-6 text-center">
          <p className="text-white/40 text-xs mb-1">Total savings</p>
          <p className="font-display text-4xl font-bold text-[#d4a853] mb-1">
            {formatCurrency(optimizationResult.savedAmount)}
          </p>
          <p className="text-white/50 text-sm">
            {formatCurrency(optimizationResult.originalTotal)} → {formatCurrency(optimizationResult.optimizedTotal)}
            <span className="text-emerald-400 ml-2">−{optimizationResult.savedPercent}%</span>
          </p>
        </div>

        {/* Individual savings */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto">
          {optimizationResult.savings.map((s: BudgetSaving, i: number) => (
            <div key={i} className="glass rounded-xl p-4 border border-white/8 animate-fade-up opacity-0"
                 style={{ animationDelay: `${i * 70}ms`, animationFillMode: "forwards" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/40 text-[11px] uppercase tracking-wider">Day {s.dayNumber} · {s.category}</span>
                <span className="text-emerald-400 text-sm font-bold">−{formatCurrency(s.saving)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/30 line-through text-xs">{s.original.name}</span>
                <span className="text-white/20">→</span>
                <span className="text-white font-medium">{s.replacement.name}</span>
              </div>
              <p className="text-white/35 text-xs mt-1.5 italic">{s.tradeoff}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setOptimizationResult(null)}
            className="flex-1 py-3 rounded-xl glass border border-white/10 text-white/50 hover:text-white text-sm transition-all">
            Reconsider
          </button>
          <button onClick={applyOptimization}
            className="flex-grow-[2] py-3 rounded-xl btn-primary text-sm font-semibold">
            ✅ Apply savings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Target reduction</p>
        <div className="flex gap-2">
          {REDUCTION_OPTIONS.map((pct) => (
            <button key={pct} type="button" onClick={() => setTargetPct(pct)}
              className={cn("flex-1 py-3 rounded-xl border text-sm font-semibold transition-all",
                targetPct === pct ? "bg-gradient-to-br from-[#d4a853] to-[#e2714b] border-transparent text-white shadow-lg" : "glass border-white/10 text-white/45 hover:border-white/20 hover:text-white")}>
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="glass rounded-xl p-4 border border-white/8">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-white/40">Current total</span>
          <span className="text-white">{formatCurrency(itinerary.totalCost)}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-white/40">Target savings</span>
          <span className="text-emerald-400 font-semibold">−{formatCurrency(Math.round(itinerary.totalCost * targetPct / 100))}</span>
        </div>
        <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-400"
               style={{ width: `${targetPct}%` }} />
        </div>
      </div>

      {budgetError && (
        <div className="glass rounded-xl p-3 border border-rose-500/25 bg-rose-500/5">
          <p className="text-rose-400 text-xs">{budgetError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl glass border border-white/10 text-white/50 hover:text-white text-sm transition-all">
          Cancel
        </button>
        <button onClick={handleOptimize} disabled={isOptimizing}
          className={cn("flex-grow-[2] py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
            !isOptimizing ? "btn-primary" : "glass border border-white/8 text-white/25 cursor-not-allowed")}>
          {isOptimizing
            ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Optimizing…</>
            : `💰 Save ${targetPct}% on my trip`}
        </button>
      </div>
    </div>
  );
}
