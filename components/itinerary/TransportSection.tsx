"use client";
// components/itinerary/TransportSection.tsx — Premium transport cards

import type { GeneratedTransport } from "@/types";
import { TRANSPORT_ICONS } from "@/lib/constants";
import { minutesToHours, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils/cn";

const TRANSPORT_COLORS: Record<string, string> = {
  metro: "text-blue-400  bg-blue-500/10  border-blue-500/20",
  walk:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  taxi:  "text-amber-400 bg-amber-500/10 border-amber-500/20",
  bus:   "text-violet-400 bg-violet-500/10 border-violet-500/20",
  ferry: "text-cyan-400  bg-cyan-500/10  border-cyan-500/20",
  train: "text-rose-400  bg-rose-500/10  border-rose-500/20",
};

interface TransportSectionProps {
  transport: GeneratedTransport[];
}

export function TransportSection({ transport }: TransportSectionProps) {
  if (!transport.length) return null;

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {transport.map((t, i) => {
          const icon  = TRANSPORT_ICONS[t.type] ?? "🚗";
          const color = TRANSPORT_COLORS[t.type] ?? "text-white/50 bg-white/5 border-white/10";

          return (
            <div
              key={t.id}
              className={cn(
                "glass rounded-xl border p-3.5 flex items-center gap-3",
                "hover:border-white/18 transition-all duration-200 group",
                "animate-fade-up opacity-0"
              )}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "forwards" }}
            >
              {/* Mode badge */}
              <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center text-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110", color)}>
                {icon}
              </div>

              <div className="flex-1 min-w-0">
                {/* Route */}
                <div className="flex items-center gap-1.5 text-xs text-white/60 mb-0.5">
                  <span className="truncate max-w-[80px] font-medium">{t.from}</span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="flex-shrink-0 text-white/25">
                    <path d="M1 4h10M8 1l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span className="truncate max-w-[80px] font-medium">{t.to}</span>
                </div>
                {t.notes && (
                  <p className="text-white/30 text-[11px] leading-tight truncate">{t.notes}</p>
                )}
              </div>

              {/* Time + cost */}
              <div className="text-right flex-shrink-0 pl-2">
                <p className="text-white/60 text-xs font-medium">{minutesToHours(t.duration)}</p>
                <p className={cn("text-xs font-semibold", t.cost === 0 ? "text-emerald-400" : "text-[#d4a853]")}>
                  {t.cost === 0 ? "Free" : formatCurrency(t.cost)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
