// lib/ai/providers/mock.provider.ts
// ─── Mock AI Provider ─────────────────────────────────────────────────────────
// Used for development/demo when no OpenAI API key is available.
// Key improvements over original mock-response.ts:
//  - Deterministic lat/lng (no Math.random → no React hydration mismatch)
//  - Day data is varied not identical across all days
//  - Single costByStyle helper instead of inline ternary chains
//  - Fully typed — no "as const" casts needed on priceRange/type

import type { TripInputs, GeneratedItinerary, GeneratedDay, TravelStyle, PriceRange } from "@/types";
import type { AIProvider } from "./types";
import { getTripDuration } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Deterministic pseudo-random from a seed — avoids hydration mismatches */
function seededFloat(seed: string, index: number): number {
  let hash = 0;
  const str = `${seed}${index}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

/** Pick a value based on travel style */
function byStyle<T>(style: TravelStyle, budget: T, comfort: T, luxury: T): T {
  return style === "luxury" ? luxury : style === "comfort" ? comfort : budget;
}

function priceRangeByStyle(style: TravelStyle): PriceRange {
  return byStyle<PriceRange>(style, "$", "$$", "$$$");
}

function dinnerPriceByStyle(style: TravelStyle): PriceRange {
  return byStyle<PriceRange>(style, "$$", "$$$", "$$$$");
}

// ─── Day builder ──────────────────────────────────────────────────────────────

const DAY_THEMES = [
  "Arrival & First Impressions",
  "Hidden Gems & Local Life",
  "History, Culture & Art",
  "Nature & Scenic Wonders",
  "Culinary Deep Dive",
  "Adventure & Exploration",
  "Markets, Shopping & Farewells",
] as const;

function buildDay(inputs: TripInputs, dayIndex: number, date: string, dailyBudget: number): GeneratedDay {
  const { destination, travelStyle, travelers } = inputs;
  const seed = `${destination}-${dayIndex}`;

  // Deterministic coords based on destination name + day index
  const baseLat = 20 + (destination.charCodeAt(0) % 40);
  const baseLng = -30 + (destination.charCodeAt(Math.min(1, destination.length - 1)) % 80);
  const latOff = (seededFloat(seed, 0) - 0.5) * 0.12;
  const lngOff = (seededFloat(seed, 1) - 0.5) * 0.12;

  return {
    dayNumber: dayIndex + 1,
    date,
    theme: DAY_THEMES[dayIndex % DAY_THEMES.length],
    summary: `Discover the highlights of ${destination} through day ${dayIndex + 1}'s curated selection.`,
    estimatedCost: dailyBudget,
    activities: [
      {
        id: `act_${dayIndex + 1}_1`,
        name: `${destination} ${["Central Museum", "Art Gallery", "Heritage Site", "Cultural Center", "Historic Palace"][dayIndex % 5]}`,
        description: `One of ${destination}'s most celebrated cultural institutions. The architecture itself is worth the visit.`,
        category: ["museum", "attraction", "museum", "attraction", "museum"][dayIndex % 5],
        startTime: "09:00",
        endTime: "11:30",
        duration: 150,
        cost: byStyle(travelStyle, 8, 15, 25),
        address: `${100 + dayIndex * 7} Culture Street, ${destination}`,
        lat: baseLat + latOff,
        lng: baseLng + lngOff,
        tips: "Arrive at opening time to beat the crowds.",
      },
      {
        id: `act_${dayIndex + 1}_2`,
        name: `${destination} ${["Historic Quarter Walk", "Waterfront Promenade", "Old Town Tour", "Market District", "Scenic Gardens"][dayIndex % 5]}`,
        description: `A self-guided walk through the most atmospheric areas of ${destination}.`,
        category: "attraction",
        startTime: "14:00",
        endTime: "16:00",
        duration: 120,
        cost: 0,
        address: `Old Quarter, ${destination}`,
        lat: baseLat + latOff * 0.7,
        lng: baseLng + lngOff * 0.7,
        tips: "Wear comfortable shoes and bring water.",
      },
      {
        id: `act_${dayIndex + 1}_3`,
        name: `${destination} ${["Viewpoint", "Hilltop Lookout", "Panorama Terrace", "Observation Deck", "Sunset Point"][dayIndex % 5]}`,
        description: `Sweeping 360° views of ${destination}. The golden hour light transforms the cityscape.`,
        category: "nature",
        startTime: "17:30",
        endTime: "19:00",
        duration: 90,
        cost: 0,
        address: `Summit District, ${destination}`,
        lat: baseLat + latOff * 1.2,
        lng: baseLng + lngOff * 1.2,
        tips: "Come 30 minutes before sunset — spots fill up quickly.",
      },
    ],
    meals: [
      {
        id: `meal_${dayIndex + 1}_1`,
        name: ["Café du Matin", "Morning Brew", "La Pausa", "Sunrise Bakery", "Le Petit Déjeuner"][dayIndex % 5],
        type: "breakfast",
        cuisine: "Local",
        description: `A beloved neighborhood spot where locals start their day in ${destination}.`,
        priceRange: "$",
        cost: byStyle(travelStyle, 8, 12, 20),
        address: `${5 + dayIndex} Morning Lane, ${destination}`,
        lat: baseLat + latOff * 0.3,
        lng: baseLng + lngOff * 0.3,
        rating: 4.5 + seededFloat(seed, 3) * 0.4,
        tips: "Pastries sell out early — arrive before 9am.",
      },
      {
        id: `meal_${dayIndex + 1}_2`,
        name: ["Mercado Bistro", "La Tavola", "The Local Table", "Souk Kitchen", "Piazza Café"][dayIndex % 5],
        type: "lunch",
        cuisine: ["Mediterranean Fusion", "Contemporary", "Traditional", "Regional", "Farm-to-Table"][dayIndex % 5],
        description: `A market-driven restaurant in ${destination} celebrated for its fresh seasonal menu.`,
        priceRange: priceRangeByStyle(travelStyle),
        cost: byStyle(travelStyle, 15, 28, 50),
        address: `${78 + dayIndex * 3} Market Square, ${destination}`,
        lat: baseLat + latOff * 0.9,
        lng: baseLng + lngOff * 0.9,
        rating: 4.7 + seededFloat(seed, 4) * 0.2,
        tips: "Book the terrace in advance for the best views.",
      },
      {
        id: `meal_${dayIndex + 1}_3`,
        name: ["La Maison Dorée", "Il Magnifico", "The Grand Table", "Château Étoile", "Villa Lusso"][dayIndex % 5],
        type: "dinner",
        cuisine: "Contemporary Fine Dining",
        description: `The jewel of ${destination}'s dining scene — an unmissable culinary experience.`,
        priceRange: dinnerPriceByStyle(travelStyle),
        cost: byStyle(travelStyle, 35, 70, 130),
        address: `${12 + dayIndex * 2} Golden Avenue, ${destination}`,
        lat: baseLat + latOff * 1.5,
        lng: baseLng + lngOff * 1.5,
        rating: 4.9,
        tips: "Reserve at least 3 days ahead. The tasting menu is worth every penny.",
      },
    ],
    transport: [
      {
        id: `trans_${dayIndex + 1}_1`,
        type: "metro",
        from: "Hotel",
        to: `${destination} Central Museum`,
        duration: 20,
        cost: 3 * travelers,
        notes: "Direct line — no transfers needed.",
      },
      {
        id: `trans_${dayIndex + 1}_2`,
        type: "walk",
        from: "Museum District",
        to: "Lunch Restaurant",
        duration: 12,
        cost: 0,
        notes: "A pleasant 12-minute walk through the main boulevard.",
      },
      {
        id: `trans_${dayIndex + 1}_3`,
        type: "taxi",
        from: "Historic Quarter",
        to: "Dinner Restaurant",
        duration: 15,
        cost: 12 * Math.ceil(travelers / 4),
        notes: "Use a ride-hailing app for a fixed price.",
      },
    ],
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class MockProvider implements AIProvider {
  readonly name = "mock";
  private readonly delayMs: number;

  constructor(delayMs = 2000) {
    this.delayMs = delayMs;
  }

  async generateItinerary(inputs: TripInputs): Promise<GeneratedItinerary> {
    if (this.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.delayMs));
    }

    const numDays = Math.min(getTripDuration(inputs.startDate, inputs.endDate), 14);
    const dailyBudget = Math.round(inputs.budget / numDays);
    const start = new Date(inputs.startDate);

    const days: GeneratedDay[] = Array.from({ length: numDays }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return buildDay(inputs, i, date.toISOString().split("T")[0], dailyBudget);
    });

    return {
      tripId: `mock-${inputs.destination.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      destination: inputs.destination,
      summary: `Your ${numDays}-day journey through ${inputs.destination} has been curated to deliver an unforgettable blend of culture, cuisine, and discovery — perfectly tuned to your ${inputs.travelStyle} travel style.`,
      totalCost: inputs.budget,
      currency: "USD",
      days,
      generatedAt: new Date().toISOString(),
    };
  }
}
