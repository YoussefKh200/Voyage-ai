// lib/ai/engine/prompts.ts
// ─── Production Prompt Engineering System ────────────────────────────────────
// Design goals:
//  1. Token efficiency — every token costs money at scale
//  2. Schema fidelity — format instructions are precise and repeated near the end
//     (models pay more attention to recent context)
//  3. Versioned — increment PROMPT_VERSION when making semantic changes so you
//     can track which itineraries were generated with which prompt
//  4. Testable — pure functions, no side effects

import type { TripInputs } from "@/types";
import { formatDate, getTripDuration } from "@/lib/utils";

export const PROMPT_VERSION = "v2.1.0";

// ─── Style context maps ───────────────────────────────────────────────────────
// Maps enum values to natural-language guidance the AI understands well.

const STYLE_CONTEXT = {
  budget: {
    label: "budget traveler",
    accommodation: "hostels, guesthouses, budget hotels (2–3 star)",
    transport: "public transit, walking, shared rides",
    dining: "street food, local markets, casual restaurants",
    activities: "free attractions, city walks, self-guided tours",
    dailyCostHint: "Target: $30–80/person/day all-in",
  },
  comfort: {
    label: "comfort traveler",
    accommodation: "3–4 star hotels, boutique stays",
    transport: "mix of public and private transport, taxis for convenience",
    dining: "sit-down restaurants, local specialties, occasional splurge",
    activities: "guided tours, popular attractions, cultural experiences",
    dailyCostHint: "Target: $100–250/person/day all-in",
  },
  luxury: {
    label: "luxury traveler",
    accommodation: "5-star hotels, design hotels, premium suites",
    transport: "private transfers, business class trains, car hire",
    dining: "Michelin-starred restaurants, rooftop bars, private dining",
    activities: "private tours, exclusive experiences, premium access",
    dailyCostHint: "Target: $300–700+/person/day all-in",
  },
} as const;

const INTEREST_GUIDANCE: Record<string, string> = {
  food:      "weight the itinerary toward culinary experiences, food tours, cooking classes, and memorable restaurants",
  nightlife: "include evening entertainment, rooftop bars, live music venues, and club culture",
  museums:   "prioritise world-class museums, galleries, and cultural institutions — include opening hours",
  shopping:  "include local markets, boutique districts, artisan shops, and department stores",
  adventure: "incorporate outdoor activities, sports, physical challenges, and adrenaline experiences",
  nature:    "include parks, botanical gardens, scenic viewpoints, and natural landscapes",
  luxury:    "emphasise exclusive experiences, VIP access, spa days, and premium amenities",
};

// ─── System prompt ────────────────────────────────────────────────────────────
// Kept concise — the user prompt carries all trip-specific context.
// System prompt establishes persona and absolute rules.

export function buildSystemPrompt(): string {
  return `You are an expert travel itinerary architect with deep local knowledge of destinations worldwide. You create highly personalised, realistic, and actionable travel plans.

ABSOLUTE RULES:
- Respond ONLY with a single valid JSON object — no markdown fences, no prose, no explanations
- Use REAL place names, restaurant names, and addresses from the actual destination
- All costs in USD integers (no decimals, no currency symbols)
- Times in 24-hour HH:MM format
- Dates in YYYY-MM-DD format
- Geographic coordinates must be accurate (double-check lat/lng for landmarks)
- Activity timings must be realistic — account for travel between locations
- Budget constraints are hard limits — total itinerary cost must not exceed the provided budget`;
}

// ─── User prompt ──────────────────────────────────────────────────────────────
// Structured in order of model attention: context → constraints → format.
// The JSON schema is specified twice: as prose (for understanding) and as a
// compact template (for accurate field names and types).

export function buildItineraryPrompt(inputs: TripInputs): string {
  const duration = getTripDuration(inputs.startDate, inputs.endDate);
  const startFormatted = formatDate(inputs.startDate, "MMMM d, yyyy");
  const endFormatted = formatDate(inputs.endDate, "MMMM d, yyyy");
  const budgetPerDay = Math.round(inputs.budget / duration);
  const budgetPerPersonPerDay = Math.round(inputs.budget / duration / inputs.travelers);
  const style = STYLE_CONTEXT[inputs.travelStyle];

  const interestGuides = inputs.interests
    .filter((i) => INTEREST_GUIDANCE[i])
    .map((i) => `• ${INTEREST_GUIDANCE[i]}`)
    .join("\n");

  // Build the JSON schema template with inline type annotations
  const schemaTemplate = buildSchemaTemplate(duration, inputs.startDate);

  return `Generate a complete ${duration}-day travel itinerary for this trip:

DESTINATION: ${inputs.destination}
DATES: ${startFormatted} → ${endFormatted} (${duration} nights)
TRAVELERS: ${inputs.travelers} ${inputs.travelers === 1 ? "adult" : "adults"}
TOTAL BUDGET: $${inputs.budget.toLocaleString()} USD ($${budgetPerDay}/day total, $${budgetPerPersonPerDay}/person/day)
TRAVEL STYLE: ${style.label}

STYLE GUIDANCE:
• Accommodation: ${style.accommodation}
• Transport: ${style.transport}
• Dining: ${style.dining}
• Activities: ${style.activities}
• ${style.dailyCostHint}

INTEREST PRIORITIES (most important — weave throughout all days):
${interestGuides}

ITINERARY PRINCIPLES:
• Day 1: Arrival + orientation activities near the centre. No rushed schedule.
• Last day: Light morning activities + checkout/airport transfer.
• Mid-trip: Full exploration days matching their interests.
• Vary energy levels — mix intense and relaxed days.
• Cluster geographically — minimise backtracking within each day.
• Include 1 "signature" experience per day that is unique to ${inputs.destination}.
• Give each restaurant a specific cuisine and neighbourhood context.
• For each activity, specify exactly what makes it worth visiting.

COST CONSTRAINTS (strict — total must be ≤ $${inputs.budget}):
• Distribute costs across ${duration} days: aim for $${budgetPerDay}/day
• Include all costs: entry fees, meals, transport, tips, incidentals
• Activities marked cost: 0 are free attractions
• Transport costs are TOTAL for all ${inputs.travelers} traveler${inputs.travelers !== 1 ? "s" : ""}

Return this exact JSON structure — every field is required:
${schemaTemplate}`;
}

// ─── Schema template builder ──────────────────────────────────────────────────
// Generates a compact but precise JSON template for the AI to follow.
// The date array is pre-computed so the AI never needs to calculate dates.

function buildSchemaTemplate(duration: number, startDate: string): string {
  const dayDates = Array.from({ length: duration }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const dayExample = (date: string, dayNum: number) => `    {
      "dayNumber": ${dayNum},
      "date": "${date}",
      "theme": "string — evocative 3-5 word day theme",
      "summary": "string — one sentence describing the day's character",
      "estimatedCost": "integer — total USD for all ${"{travelers}"} travelers this day",
      "activities": [
        {
          "id": "act_${dayNum}_1",
          "name": "string — exact venue/attraction name",
          "description": "string — 2-3 sentences with specific details",
          "category": "museum|attraction|adventure|shopping|nature|nightlife|food",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "duration": "integer — minutes",
          "cost": "integer — USD per person",
          "address": "string — full street address",
          "lat": "number — accurate latitude",
          "lng": "number — accurate longitude",
          "tips": "string — one specific insider tip"
        }
      ],
      "meals": [
        {
          "id": "meal_${dayNum}_1",
          "name": "string — exact restaurant name",
          "type": "breakfast|lunch|dinner",
          "cuisine": "string — specific cuisine type",
          "description": "string — what makes this place special",
          "priceRange": "$|$$|$$$|$$$$",
          "cost": "integer — USD per person including drinks",
          "address": "string — full street address",
          "lat": "number",
          "lng": "number",
          "rating": "number — 3.5 to 5.0",
          "tips": "string — booking advice or must-order dish"
        }
      ],
      "transport": [
        {
          "id": "trans_${dayNum}_1",
          "type": "taxi|metro|walk|bus|ferry|train",
          "from": "string — departure point",
          "to": "string — destination",
          "duration": "integer — minutes",
          "cost": "integer — total USD for all travelers",
          "notes": "string — practical detail (line number, app to use, etc.)"
        }
      ]
    }`;

  const daysPreview = dayDates.slice(0, Math.min(2, duration)).map((d, i) => dayExample(d, i + 1)).join(",\n");
  const ellipsis = duration > 2 ? `    // ... continue for all ${duration} days` : "";

  return `{
  "destination": "${"{destination}"}",
  "summary": "string — 2-3 sentences capturing the essence of this trip",
  "totalCost": "integer — grand total USD (must be ≤ budget)",
  "currency": "USD",
  "days": [
${daysPreview}${ellipsis ? `\n${ellipsis}` : ""}
  ]
}`;
}

// ─── Token budget estimation ──────────────────────────────────────────────────
// Rough estimate: 1 token ≈ 4 chars. Used to warn before sending very long prompts.

export function estimatePromptTokens(inputs: TripInputs): number {
  const systemLen = buildSystemPrompt().length;
  const userLen = buildItineraryPrompt(inputs).length;
  return Math.ceil((systemLen + userLen) / 4);
}
