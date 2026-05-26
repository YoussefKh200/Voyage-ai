"use client";
// app/itinerary/page.tsx — World-class itinerary display with generating state

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePlannerStore, selectItinerary, selectInputs } from "@/lib/store/planner.store";
import { DayCard } from "@/components/itinerary/DayCard";
import { CostBreakdown } from "@/components/itinerary/CostBreakdown";
import { WeatherWidget } from "@/components/itinerary/WeatherWidget";
import { MapSection } from "@/components/itinerary/map/MapSection";
import { GeneratingState } from "@/components/itinerary/ItinerarySkeleton";
import { AppBackground } from "@/components/shared/AppBackground";
import { AppHeader } from "@/components/shared/AppHeader";
import { formatCurrency, formatDate, getTripDuration } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { WowToolbar }    from "@/components/wow/WowToolbar";
import { ChatAssistant } from "@/components/wow/ChatAssistant";

export default function ItineraryPage() {
  const router     = useRouter();
  const itinerary  = usePlannerStore(selectItinerary);
  const inputs     = usePlannerStore(selectInputs);
  const { isGenerating, error, reset } = usePlannerStore();
  const topRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!itinerary && !isGenerating) {
      router.replace("/planner");
    }
  }, [itinerary, isGenerating, router]);

  // Scroll to top when itinerary arrives
  useEffect(() => {
    if (itinerary && topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [itinerary]);

  // Full-page generating animation
  if (isGenerating || (!itinerary && !error)) {
    return <GeneratingState />;
  }

  // Error state
  if (error && !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass rounded-3xl border border-rose-500/25 p-10 max-w-md text-center space-y-5">
          <div className="text-5xl">😞</div>
          <h2 className="font-display text-2xl font-bold text-white">Something went wrong</h2>
          <p className="text-white/50 text-sm leading-relaxed">{error}</p>
          <button
            onClick={() => router.push("/planner")}
            className="btn-primary px-8 py-3 rounded-xl text-sm font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!itinerary) return null;

  const duration      = inputs.startDate && inputs.endDate ? getTripDuration(inputs.startDate, inputs.endDate) : itinerary.days.length;
  const travelers     = inputs.travelers ?? 1;
  const perPersonCost = Math.round(itinerary.totalCost / travelers);
  const firstActivity = itinerary.days[0]?.activities[0];
  const centerLat     = firstActivity?.lat;
  const centerLng     = firstActivity?.lng;
  const totalActivities = itinerary.days.reduce((s, d) => s + d.activities.length, 0);
  const totalRestaurants = itinerary.days.reduce((s, d) => s + d.meals.length, 0);

  return (
    <div className="min-h-screen" ref={topRef}>
      <AppBackground variant="subtle" />

      <AppHeader
        sticky
        rightSlot={
          <>
            <Link href="/planner" className="text-sm text-white/40 hover:text-white/70 transition-colors hidden sm:block">
              ← Edit trip
            </Link>
            <button
              type="button"
              onClick={() => { reset(); router.push("/planner"); }}
              className="text-sm px-4 py-2 rounded-xl glass border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all duration-200"
            >
              New trip
            </button>
          </>
        }
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero */}
        <div className="glass rounded-3xl border border-[#d4a853]/20 overflow-hidden mb-8 animate-scale-in">
          <div className="px-6 sm:px-10 py-8 sm:py-12 relative overflow-hidden"
               style={{ background: "linear-gradient(135deg, rgba(212,168,83,0.12) 0%, rgba(226,113,75,0.07) 60%, rgba(124,58,237,0.05) 100%)" }}>
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-15 pointer-events-none"
                 style={{ background: "radial-gradient(circle, #d4a853, transparent 70%)", filter: "blur(40px)" }} />
            <div className="absolute -left-10 bottom-0 w-48 h-48 rounded-full opacity-8 pointer-events-none"
                 style={{ background: "radial-gradient(circle, #e2714b, transparent 70%)", filter: "blur(40px)" }} />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 glass-gold px-3 py-1 rounded-full text-[#d4a853] text-xs font-medium mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853] animate-pulse" />
                AI-generated itinerary
              </div>
              <h1 className="font-display text-4xl sm:text-6xl font-bold text-white mb-3 leading-tight">
                {itinerary.destination}
              </h1>
              {inputs.startDate && inputs.endDate && (
                <p className="text-white/45 text-base mb-8">
                  {formatDate(inputs.startDate)} → {formatDate(inputs.endDate)} · {duration} days
                  {travelers > 1 && ` · ${travelers} travelers`}
                </p>
              )}

              {/* Stat pills */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { icon: "💰", label: "Budget",      value: formatCurrency(itinerary.totalCost) },
                  { icon: "👤", label: "Per person",   value: formatCurrency(perPersonCost) },
                  { icon: "🗓️", label: "Days",         value: `${itinerary.days.length} days` },
                  { icon: "🎯", label: "Activities",   value: `${totalActivities} planned` },
                  { icon: "🍽️", label: "Restaurants",  value: `${totalRestaurants} spots` },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="glass border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2.5
                               animate-fade-up opacity-0 hover:border-[#d4a853]/25 transition-colors duration-200"
                    style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
                  >
                    <span className="text-base" aria-hidden>{stat.icon}</span>
                    <div>
                      <p className="text-white/30 text-[10px] uppercase tracking-wide">{stat.label}</p>
                      <p className="text-white font-semibold text-sm">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="px-6 sm:px-10 py-5 border-t border-white/8">
            <p className="text-white/55 text-base leading-relaxed italic">
              &ldquo;{itinerary.summary}&rdquo;
            </p>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-8 items-start">
          {/* Main */}
          <div className="space-y-6 min-w-0">
            <MapSection days={itinerary.days} destination={itinerary.destination} centerLat={centerLat} centerLng={centerLng} />

            <div className="space-y-4">
              <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                <span aria-hidden>🗺️</span> Day-by-day
              </h2>
              <div className="space-y-4">
                {itinerary.days.map((day, i) => (
                  <DayCard key={day.dayNumber} day={day} defaultExpanded={i === 0} globalIndex={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24">
            <CostBreakdown itinerary={itinerary} travelers={travelers} />
            {inputs.startDate && inputs.endDate && (
              <WeatherWidget destination={itinerary.destination} startDate={inputs.startDate} endDate={inputs.endDate} lat={centerLat} lng={centerLng} />
            )}

            {/* Quick stats */}
            <div className="glass rounded-2xl border border-white/10 p-5 space-y-3">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <span aria-hidden>📊</span> Trip summary
              </h3>
              <dl className="space-y-2.5">
                {[
                  ["Destination", itinerary.destination],
                  ["Duration",    `${itinerary.days.length} days`],
                  ["Travelers",   String(travelers)],
                  ["Style",       inputs.travelStyle ?? "comfort"],
                  ["Activities",  String(totalActivities)],
                  ["Restaurants", String(totalRestaurants)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <dt className="text-white/35 text-xs">{label}</dt>
                    <dd className="text-white/75 text-xs font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Actions */}
            <div className="glass rounded-2xl border border-white/10 p-5 space-y-2.5">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => null)}
                className="w-full py-2.5 px-4 rounded-xl glass border border-white/10 text-white/55 hover:text-white hover:border-white/20 transition-all text-sm flex items-center justify-center gap-2"
              >
                📋 Copy link
              </button>
              <button
                type="button"
                onClick={() => window.print?.()}
                className="w-full py-2.5 px-4 rounded-xl glass border border-white/10 text-white/55 hover:text-white hover:border-white/20 transition-all text-sm flex items-center justify-center gap-2"
              >
                🖨️ Print
              </button>
              <button
                type="button"
                onClick={() => { reset(); router.push("/planner"); }}
                className="w-full btn-primary py-2.5 px-4 rounded-xl text-sm font-medium"
              >
                ✨ Plan another trip
              </button>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 glass rounded-2xl border border-white/10 p-7 flex flex-col sm:flex-row gap-5 items-center justify-between">
          <div>
            <p className="text-white font-display text-lg font-semibold mb-0.5">Love your itinerary?</p>
            <p className="text-white/35 text-sm">Share with your travel companions.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button className="px-5 py-2.5 rounded-xl glass border border-white/15 text-white/55 text-sm hover:text-white transition-all">
              📤 Share
            </button>
            <button onClick={() => { reset(); router.push("/planner"); }} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium">
              New trip →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
