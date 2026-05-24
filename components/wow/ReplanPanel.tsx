"use client";
// components/wow/ReplanPanel.tsx — AI Replanning: "Rain tomorrow? Rebuild itinerary."

import { useState } from "react";
import { useWowStore } from "@/lib/store/wow.store";
import { usePlannerStore, selectItinerary, selectInputs } from "@/lib/store/planner.store";
import type { ReplanTrigger, ReplanChange } from "@/types";
import { cn } from "@/lib/utils/cn";

const TRIGGERS: { value: ReplanTrigger; icon: string; label: string; example: string }[] = [
  { value: "weather",  icon: "🌧️", label: "Bad weather",    example: "Rain forecast on day 2"            },
  { value: "crowd",    icon: "👥", label: "Too crowded",    example: "Avoid peak tourist rush"            },
  { value: "closed",   icon: "🔒", label: "Venue closed",   example: "Museum closed on Mondays"           },
  { value: "budget",   icon: "💸", label: "Over budget",    example: "We've overspent, adjust remaining"  },
  { value: "custom",   icon: "✏️", label: "Custom reason",  example: "Describe any change you need..."    },
];

interface ReplanPanelProps {
  onClose: () => void;
  onComplete: () => void;
}

export function ReplanPanel({ onClose, onComplete }: ReplanPanelProps) {
  const itinerary   = usePlannerStore(selectItinerary);
  const inputs      = usePlannerStore(selectInputs);
  const setItinerary = usePlannerStore((s) => s.setItinerary);
  const { isReplanning, replanChanges, replanError, setReplanning, setReplanChanges, setReplanError } = useWowStore();

  const [trigger, setTrigger]         = useState<ReplanTrigger>("weather");
  const [reason, setReason]           = useState("");
  const [affectedDays, setAffectedDays] = useState<number[]>([]);
  const [completed, setCompleted]     = useState(false);

  if (!itinerary || !inputs) return null;

  const selectedTrigger = TRIGGERS.find((t) => t.value === trigger);

  async function handleReplan() {
    if (!reason.trim() || isReplanning) return;
    setReplanning(true);
    setReplanError(null);
    setReplanChanges(null);

    try {
      const res = await fetch("/api/replan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itinerary,
          inputs,
          trigger,
          reason,
          affectedDays: affectedDays.length ? affectedDays : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Replan failed");

      setItinerary(json.data.itinerary);
      setReplanChanges(json.data.changes ?? []);
      setCompleted(true);
    } catch (err) {
      setReplanError(err instanceof Error ? err.message : "Replan failed. Please try again.");
    } finally {
      setReplanning(false);
    }
  }

  if (completed && replanChanges) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl mx-auto mb-3">✅</div>
          <h3 className="font-display text-xl font-bold text-white">Itinerary updated!</h3>
          <p className="text-white/45 text-sm mt-1">{replanChanges.length} change{replanChanges.length !== 1 ? "s" : ""} made</p>
        </div>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {replanChanges.map((c: ReplanChange, i: number) => (
            <div key={i} className="glass rounded-xl p-3.5 border border-emerald-500/20 flex gap-3 animate-fade-up opacity-0"
                 style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}>
              <span className="text-emerald-400 text-lg flex-shrink-0">→</span>
              <div>
                <p className="text-white/70 text-sm font-medium">Day {c.dayNumber}</p>
                <p className="text-white/45 text-xs leading-relaxed">{c.description}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => { onComplete(); onClose(); }}
          className="btn-primary w-full py-3 rounded-xl text-sm font-semibold">
          View updated itinerary →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trigger selector */}
      <div>
        <p className="text-white/50 text-xs uppercase tracking-wider mb-3">What changed?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRIGGERS.map((t) => (
            <button key={t.value} type="button" onClick={() => { setTrigger(t.value); setReason(""); }}
              className={cn("p-3 rounded-xl border text-left transition-all duration-200",
                trigger === t.value ? "border-[#d4a853]/50 bg-[#d4a853]/10" : "glass border-white/8 hover:border-white/20")}>
              <div className="text-xl mb-1">{t.icon}</div>
              <div className={cn("text-xs font-medium", trigger === t.value ? "text-[#d4a853]" : "text-white/60")}>{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Reason input */}
      <div>
        <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">Describe the issue</label>
        <textarea
          placeholder={selectedTrigger?.example}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input-glass w-full px-4 py-3 rounded-xl text-sm resize-none h-20 leading-relaxed"
        />
      </div>

      {/* Affected days toggle */}
      {itinerary.days.length > 1 && (
        <div>
          <p className="text-white/40 text-xs mb-2">Replan which days? (empty = all)</p>
          <div className="flex flex-wrap gap-2">
            {itinerary.days.map((d) => (
              <button key={d.dayNumber} type="button"
                onClick={() => setAffectedDays((prev) => prev.includes(d.dayNumber) ? prev.filter((x) => x !== d.dayNumber) : [...prev, d.dayNumber])}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  affectedDays.includes(d.dayNumber) ? "bg-[#d4a853]/20 border-[#d4a853]/40 text-[#d4a853]" : "glass border-white/10 text-white/40")}>
                Day {d.dayNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {replanError && (
        <div className="glass rounded-xl p-3 border border-rose-500/25 bg-rose-500/5">
          <p className="text-rose-400 text-xs">{replanError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl glass border border-white/10 text-white/50 hover:text-white text-sm transition-all">
          Cancel
        </button>
        <button onClick={handleReplan} disabled={!reason.trim() || isReplanning}
          className={cn("flex-2 flex-grow-[2] py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
            reason.trim() && !isReplanning ? "btn-primary" : "glass border border-white/8 text-white/25 cursor-not-allowed")}>
          {isReplanning ? (
            <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Replanning…</>
          ) : "🔄 Rebuild itinerary"}
        </button>
      </div>
    </div>
  );
}
