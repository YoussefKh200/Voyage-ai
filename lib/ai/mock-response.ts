// lib/ai/mock-response.ts
// ─── Mock AI Response ─────────────────────────────────────────────────────────
// Used for development/demo when no API key is available.
// Mirrors the exact shape of GeneratedItinerary.

import { GeneratedItinerary } from "@/types";
import { TripInputs } from "@/types";
import { generateId } from "@/lib/utils";

export function generateMockItinerary(inputs: TripInputs): GeneratedItinerary {
  const { destination, startDate, budget, travelers } = inputs;

  const days = [];
  const start = new Date(startDate);

  const dayThemes = [
    "Arrival & First Impressions",
    "Hidden Gems & Local Life",
    "History, Culture & Art",
    "Nature & Scenic Wonders",
    "Culinary Deep Dive",
    "Adventure & Exploration",
    "Markets, Shopping & Farewells",
  ];

  const numDays = Math.min(
    Math.round((new Date(inputs.endDate).getTime() - start.getTime()) / 86400000) + 1,
    7
  );

  for (let i = 0; i < numDays; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    days.push({
      dayNumber: i + 1,
      date: dateStr,
      theme: dayThemes[i % dayThemes.length],
      summary: `Explore the best of ${destination} through curated experiences perfectly matched to your interests.`,
      estimatedCost: Math.round(budget / numDays),
      activities: [
        {
          id: `act_${i + 1}_1`,
          name: `${destination} Central Museum`,
          description: `One of ${destination}'s most celebrated cultural institutions, housing an extraordinary collection spanning centuries of local history and art. The architecture itself is worth the visit.`,
          category: "museum",
          startTime: "09:00",
          endTime: "11:30",
          duration: 150,
          cost: inputs.travelStyle === "luxury" ? 25 : inputs.travelStyle === "comfort" ? 15 : 8,
          address: `123 Culture Street, ${destination}`,
          lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          lng: 2.3522 + (Math.random() - 0.5) * 0.1,
          tips: "Arrive right at opening to beat the crowds. The top floor has the best panoramic views.",
        },
        {
          id: `act_${i + 1}_2`,
          name: `${destination} Historic Quarter Walk`,
          description: `A self-guided walking tour through the most atmospheric streets in ${destination}. Centuries-old architecture meets vibrant street art and hidden courtyards.`,
          category: "attraction",
          startTime: "14:00",
          endTime: "16:00",
          duration: 120,
          cost: 0,
          address: `Old Quarter, ${destination}`,
          lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          lng: 2.3522 + (Math.random() - 0.5) * 0.1,
          tips: "Wear comfortable shoes — cobblestones are charming but uneven.",
        },
        {
          id: `act_${i + 1}_3`,
          name: `Sunset at ${destination} Viewpoint`,
          description: `The most iconic viewpoint in the city, offering sweeping 360° views. The golden hour light transforms the cityscape into something magical.`,
          category: "nature",
          startTime: "17:30",
          endTime: "19:00",
          duration: 90,
          cost: 0,
          address: `Summit Viewpoint, ${destination}`,
          lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          lng: 2.3522 + (Math.random() - 0.5) * 0.1,
          tips: "Come 30 minutes before sunset — it gets busy fast.",
        },
      ],
      meals: [
        {
          id: `meal_${i + 1}_1`,
          name: "Café du Matin",
          type: "breakfast" as const,
          cuisine: "Local",
          description: `A beloved neighborhood café where locals start their morning. Fresh pastries, strong coffee, and a warm atmosphere set the tone for the day.`,
          priceRange: "$" as const,
          cost: inputs.travelStyle === "luxury" ? 20 : 10,
          address: `5 Morning Lane, ${destination}`,
          lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          lng: 2.3522 + (Math.random() - 0.5) * 0.1,
          rating: 4.6,
          tips: "The almond croissants sell out by 9am — get there early.",
        },
        {
          id: `meal_${i + 1}_2`,
          name: "Mercado Bistro",
          type: "lunch" as const,
          cuisine: "Mediterranean Fusion",
          description: `A market-to-table restaurant celebrated for its seasonal menu and vibrant flavors. The open kitchen is theater for food lovers.`,
          priceRange: inputs.travelStyle === "luxury" ? "$$$" as const : "$$" as const,
          cost: inputs.travelStyle === "luxury" ? 45 : 25,
          address: `78 Market Square, ${destination}`,
          lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          lng: 2.3522 + (Math.random() - 0.5) * 0.1,
          rating: 4.8,
          tips: "Book ahead for the terrace seats — street views are spectacular.",
        },
        {
          id: `meal_${i + 1}_3`,
          name: "La Maison Dorée",
          type: "dinner" as const,
          cuisine: "Contemporary Fine Dining",
          description: `The jewel of ${destination}'s dining scene. Chef's daily tasting menu showcases the finest local ingredients with inventive technique. An unforgettable culinary experience.`,
          priceRange: inputs.travelStyle === "luxury" ? "$$$$" as const : "$$$" as const,
          cost: inputs.travelStyle === "luxury" ? 120 : 65,
          address: `12 Golden Avenue, ${destination}`,
          lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          lng: 2.3522 + (Math.random() - 0.5) * 0.1,
          rating: 4.9,
          tips: "The sommelier's wine pairing is worth every penny.",
        },
      ],
      transport: [
        {
          id: `trans_${i + 1}_1`,
          type: "metro" as const,
          from: "Hotel",
          to: `${destination} Central Museum`,
          duration: 20,
          cost: 3 * travelers,
          notes: "Line 4 direct — no transfers needed.",
        },
        {
          id: `trans_${i + 1}_2`,
          type: "walk" as const,
          from: `${destination} Central Museum`,
          to: "Mercado Bistro",
          duration: 12,
          cost: 0,
          notes: "A scenic 10-minute walk through the garden quarter.",
        },
        {
          id: `trans_${i + 1}_3`,
          type: "taxi" as const,
          from: "Historic Quarter",
          to: "La Maison Dorée",
          duration: 15,
          cost: 12 * Math.ceil(travelers / 4),
          notes: "Use the app for a fixed price — avoid street taxis at night.",
        },
      ],
    });
  }

  return {
    tripId: generateId(),
    destination,
    summary: `Your ${numDays}-day journey through ${destination} has been curated to deliver an unforgettable blend of culture, cuisine, and discovery. Each day is crafted to balance immersive experiences with the freedom to wander — perfectly tuned to your ${inputs.travelStyle} travel style.`,
    totalCost: budget,
    currency: "USD",
    days,
    generatedAt: new Date().toISOString(),
  };
}
