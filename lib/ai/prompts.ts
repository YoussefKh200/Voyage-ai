// lib/ai/prompts.ts
// ─── AI Prompt Engineering System ────────────────────────────────────────────
// Modular prompt templates. Each function returns a string.
// This abstraction allows easy A/B testing and model-specific tuning.

import { TripInputs } from "@/types";
import { formatDate, getTripDuration } from "@/lib/utils";

// ─── System Prompt ────────────────────────────────────────────────────────────

export function buildSystemPrompt(): string {
  return `You are Voyage AI, an expert travel planner with deep knowledge of destinations worldwide.

Your role is to generate highly detailed, realistic, and personalized travel itineraries.

Guidelines:
- Always respond with valid JSON only — no markdown, no prose outside the JSON
- Be specific: use real restaurant names, real landmark names, real addresses
- Times should be realistic and account for travel between locations
- Costs should be realistic for the destination and travel style
- Vary the pacing: not every day should be packed — include leisure time
- Include insider tips that a local guide would share
- Consider meal times: breakfast 7-9am, lunch 12-2pm, dinner 7-9pm
- Activities should be geographically logical (cluster nearby things)`;
}

// ─── User Prompt ─────────────────────────────────────────────────────────────

export function buildItineraryPrompt(inputs: TripInputs): string {
  const duration = getTripDuration(inputs.startDate, inputs.endDate);
  const startFormatted = formatDate(inputs.startDate, "MMMM d, yyyy");
  const endFormatted = formatDate(inputs.endDate, "MMMM d, yyyy");
  const budgetPerDay = Math.round(inputs.budget / duration);

  return `Generate a complete ${duration}-day travel itinerary for the following trip:

DESTINATION: ${inputs.destination}
DATES: ${startFormatted} to ${endFormatted} (${duration} days)
TOTAL BUDGET: $${inputs.budget} USD ($${budgetPerDay}/day)
TRAVELERS: ${inputs.travelers} ${inputs.travelers === 1 ? "person" : "people"}
TRAVEL STYLE: ${inputs.travelStyle}
INTERESTS: ${inputs.interests.join(", ")}

Return a JSON object with this EXACT structure:

{
  "destination": "string",
  "summary": "2-3 sentence overview of the trip",
  "totalCost": number,
  "currency": "USD",
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "theme": "Short evocative theme (e.g. 'Old City & Hidden Gems')",
      "summary": "One sentence describing the day",
      "estimatedCost": number,
      "activities": [
        {
          "id": "act_1_1",
          "name": "string",
          "description": "2-3 sentences",
          "category": "museum|attraction|adventure|shopping|nature|nightlife",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "duration": number,
          "cost": number,
          "address": "string",
          "lat": number,
          "lng": number,
          "tips": "One insider tip"
        }
      ],
      "meals": [
        {
          "id": "meal_1_1",
          "name": "Restaurant name",
          "type": "breakfast|lunch|dinner",
          "cuisine": "string",
          "description": "1-2 sentences",
          "priceRange": "$|$$|$$$|$$$$",
          "cost": number,
          "address": "string",
          "lat": number,
          "lng": number,
          "rating": number,
          "tips": "string"
        }
      ],
      "transport": [
        {
          "id": "trans_1_1",
          "type": "taxi|metro|walk|bus|ferry|train",
          "from": "string",
          "to": "string",
          "duration": number,
          "cost": number,
          "notes": "string"
        }
      ]
    }
  ]
}

Important:
- Generate exactly ${duration} days
- Start dates from ${inputs.startDate}
- Keep total cost within $${inputs.budget} budget
- Prioritize: ${inputs.interests.join(", ")}
- Match ${inputs.travelStyle} style throughout`;
}

// ─── Prompt variants for future A/B testing ───────────────────────────────────

export const PROMPT_VERSIONS = {
  v1: "base",
  v2: "detailed_with_alternatives",
} as const;
