// lib/constants/index.ts
// ─── Application-wide Constants ───────────────────────────────────────────────
// Changes:
//  - TRANSPORT_ICONS keyed by TransportType (was Record<string, string>)
//  - CATEGORY_COLORS keyed by ActivityCategory
//  - MEAL_TYPE_ICONS keyed by MealType
//  - Removed APP_NAME/APP_TAGLINE (live in lib/config/env.ts now)

import type { Interest, TravelStyle, TransportType, ActivityCategory, MealType, PriceRange } from "@/types";

// ─── Interest metadata ────────────────────────────────────────────────────────

export const INTERESTS: ReadonlyArray<{
  value: Interest;
  label: string;
  icon: string;
  description: string;
}> = [
  { value: "food",      label: "Food & Dining",      icon: "🍽️", description: "Local cuisine, street food, fine dining" },
  { value: "nightlife", label: "Nightlife",           icon: "🌙", description: "Bars, clubs, live music" },
  { value: "museums",   label: "Museums & Culture",   icon: "🏛️", description: "Art, history, science museums" },
  { value: "shopping",  label: "Shopping",            icon: "🛍️", description: "Markets, boutiques, malls" },
  { value: "adventure", label: "Adventure",           icon: "🧗", description: "Hiking, sports, outdoor thrills" },
  { value: "nature",    label: "Nature",              icon: "🌿", description: "Parks, gardens, scenic views" },
  { value: "luxury",    label: "Luxury",              icon: "✨", description: "Spas, fine hotels, exclusive experiences" },
] as const;

// ─── Travel style metadata ────────────────────────────────────────────────────

export const TRAVEL_STYLES: ReadonlyArray<{
  value: TravelStyle;
  label: string;
  icon: string;
  description: string;
  budgetHint: string;
}> = [
  { value: "budget",  label: "Budget Traveler",  icon: "🎒", description: "Hostels, street food, public transit",      budgetHint: "< $100/day"   },
  { value: "comfort", label: "Comfort Seeker",   icon: "🏨", description: "Mid-range hotels, sit-down restaurants",    budgetHint: "$100–300/day" },
  { value: "luxury",  label: "Luxury Explorer",  icon: "🥂", description: "5-star hotels, fine dining, private tours", budgetHint: "$300+/day"   },
] as const;

// ─── Domain lookup maps (typed — not Record<string, string>) ──────────────────

export const TRANSPORT_ICONS: Record<TransportType, string> = {
  taxi:   "🚕",
  metro:  "🚇",
  walk:   "🚶",
  bus:    "🚌",
  ferry:  "⛴️",
  train:  "🚂",
};

export const MEAL_TYPE_ICONS: Record<MealType, string> = {
  breakfast: "☀️",
  lunch:     "🌤️",
  dinner:    "🌙",
};

export const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
  "$":    "Budget-friendly",
  "$$":   "Moderate",
  "$$$":  "Upscale",
  "$$$$": "Fine dining",
};

export const CATEGORY_COLORS: Partial<Record<ActivityCategory, string>> & Record<string, string> = {
  museum:     "bg-violet-500/20 text-violet-300 border-violet-500/30",
  attraction: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  adventure:  "bg-rose-500/20 text-rose-300 border-rose-500/30",
  shopping:   "bg-pink-500/20 text-pink-300 border-pink-500/30",
  nature:     "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  food:       "bg-orange-500/20 text-orange-300 border-orange-500/30",
  nightlife:  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
};

// Kept for backward compat — source of truth moved to lib/config/env.ts
export const APP_NAME = "Voyage AI";
export const APP_TAGLINE = "Plan smarter. Travel deeper.";
