// lib/ai/features/prompts.ts
// ─── Wow Feature Prompt Templates ────────────────────────────────────────────
// Each feature gets its own prompt builder. All return pure strings — no side effects.
// Shared system instruction prefix keeps token usage down across features.

import type {
  ReplanRequest,
  BudgetOptimizationRequest,
  RouteOptimizationRequest,
  GeneratedItinerary,
  ChatMessage,
} from "@/types";
import type { TripInputs } from "@/lib/schemas/trip.schema";

// ─── Shared system context ────────────────────────────────────────────────────

export function buildFeatureSystemPrompt(): string {
  return `You are Voyage AI's travel intelligence engine. You modify, optimize, and enhance travel itineraries.

RULES:
- Respond ONLY with a valid JSON object — no markdown, no prose outside JSON
- Preserve tripId and all structural fields unless explicitly changing them
- All costs in USD integers
- Times in HH:MM (24-hour)
- Dates in YYYY-MM-DD
- Be specific: real place names, real addresses
- Never invent coordinates — omit lat/lng if you're not certain`;
}

// ─── 1. Replan prompt ─────────────────────────────────────────────────────────

export function buildReplanPrompt(req: ReplanRequest): string {
  const { itinerary, inputs, trigger, reason, affectedDays } = req;
  const daysToReplan = affectedDays?.length
    ? `Only replan days: ${affectedDays.join(", ")}`
    : "Replan the entire itinerary";

  const daysSummary = itinerary.days
    .map(
      (d) =>
        `Day ${d.dayNumber} (${d.date}): ${d.theme} — ${d.activities.map((a) => a.name).join(", ")}`
    )
    .join("\n");

  return `Modify this ${itinerary.destination} itinerary due to: "${reason}"

TRIGGER: ${trigger}
${daysToReplan}
BUDGET: $${inputs.budget} total, travelers: ${inputs.travelers}, style: ${inputs.travelStyle}
INTERESTS: ${inputs.interests.join(", ")}

CURRENT ITINERARY SUMMARY:
${daysSummary}

INSTRUCTIONS:
- Keep activities that are unaffected by the issue
- Replace/reschedule only what's necessary
- Maintain the same daily budget targets
- Do NOT change unaffected days
- Add a "changes" array explaining what changed and why

Return this exact JSON structure:
{
  "itinerary": { /* full GeneratedItinerary object with ALL days */ },
  "changes": [
    {
      "dayNumber": 2,
      "type": "activity_swapped|meal_swapped|route_changed|day_restructured",
      "description": "Replaced outdoor Eiffel Tower visit with Musée d'Orsay due to rain forecast"
    }
  ]
}`;
}

// ─── 2. Budget optimization prompt ───────────────────────────────────────────

export function buildBudgetOptimizationPrompt(req: BudgetOptimizationRequest): string {
  const { itinerary, inputs, targetReductionPercent, priorities } = req;
  const targetSaving = Math.round((itinerary.totalCost * targetReductionPercent) / 100);
  const targetTotal = itinerary.totalCost - targetSaving;

  const preserveList = priorities.length
    ? `PRESERVE: ${priorities.map((p) => p.replace(/_/g, " ")).join(", ")}`
    : "No explicit preservation priorities.";

  const costBreakdown = itinerary.days
    .map((d) => {
      const actTotal = d.activities.reduce((s, a) => s + a.cost * inputs.travelers, 0);
      const mealTotal = d.meals.reduce((s, m) => s + m.cost * inputs.travelers, 0);
      const transTotal = d.transport.reduce((s, t) => s + t.cost, 0);
      return `Day ${d.dayNumber}: activities $${actTotal}, meals $${mealTotal}, transport $${transTotal}`;
    })
    .join("\n");

  return `Optimize this ${itinerary.destination} itinerary to reduce total cost by ~${targetReductionPercent}%.

CURRENT TOTAL: $${itinerary.totalCost}
TARGET TOTAL: $${targetTotal} (save ~$${targetSaving})
TRAVELERS: ${inputs.travelers}
${preserveList}

CURRENT COST BREAKDOWN:
${costBreakdown}

OPTIMIZATION STRATEGY:
- Replace expensive activities with equally enjoyable free/cheaper alternatives
- Swap pricey restaurants with excellent local spots at lower price points
- Find cheaper transport options where quality isn't compromised
- Explain the tradeoff for each substitution honestly
- Do NOT just remove experiences — replace them with something still great

Return this exact JSON:
{
  "originalTotal": ${itinerary.totalCost},
  "optimizedTotal": <integer>,
  "savedAmount": <integer>,
  "savedPercent": <integer>,
  "savings": [
    {
      "category": "meal|activity|transport",
      "dayNumber": 1,
      "original": { "name": "Le Jules Verne", "cost": 180 },
      "replacement": { "name": "Café de Flore", "cost": 45 },
      "saving": 135,
      "tradeoff": "Less Michelin-starred, equally iconic Parisian institution"
    }
  ],
  "itinerary": { /* full modified GeneratedItinerary */ }
}`;
}

// ─── 3. Route optimization prompt ────────────────────────────────────────────

export function buildRouteOptimizationPrompt(req: RouteOptimizationRequest): string {
  const { itinerary, inputs } = req;

  const routesByDay = itinerary.days.map((d) => {
    const stops = [
      ...d.activities.map((a) => ({
        time: a.startTime,
        name: a.name,
        lat: a.lat,
        lng: a.lng,
        type: "activity",
      })),
      ...d.meals.map((m) => ({
        time: m.type === "breakfast" ? "08:00" : m.type === "lunch" ? "12:30" : "19:30",
        name: m.name,
        lat: m.lat,
        lng: m.lng,
        type: "meal",
      })),
    ].sort((a, b) => a.time.localeCompare(b.time));

    return `Day ${d.dayNumber} (${d.theme}):\n${stops.map((s) => `  ${s.time} - ${s.name} [${s.lat?.toFixed(3)}, ${s.lng?.toFixed(3)}]`).join("\n")}`;
  }).join("\n\n");

  return `Analyze and optimize the geographic routing for this ${itinerary.destination} itinerary.
TRAVELERS: ${inputs.travelers}, STYLE: ${inputs.travelStyle}

CURRENT DAILY ROUTES:
${routesByDay}

OPTIMIZATION GOALS:
1. Identify backtracking (visiting nearby things on different days, or doing zigzag routes)
2. Cluster geographically close venues on the same day
3. Minimize total daily travel time without sacrificing experience quality
4. Keep morning activities near accommodation if possible
5. Group evening venues (dinner + nightlife) geographically

Return this exact JSON:
{
  "issues": [
    {
      "dayNumber": 2,
      "severity": "major|minor",
      "description": "Louvre (Day 2) and Musée d'Orsay (Day 3) are 1.2km apart — inefficient to split across days",
      "wastedMinutes": 45
    }
  ],
  "totalWastedMinutesBefore": <integer>,
  "totalWastedMinutesAfter": <integer>,
  "minutesSaved": <integer>,
  "explanation": "Reordered Day 2 to cluster Left Bank museums together, saving ~45 minutes of backtracking",
  "itinerary": { /* full reordered GeneratedItinerary */ }
}`;
}

// ─── 4. Hidden gems prompt ────────────────────────────────────────────────────

export function buildHiddenGemsPrompt(
  destination: string,
  interests: string[],
  travelStyle: string
): string {
  return `Generate 8 genuinely hidden, local gems for ${destination} — not tourist traps.

TRAVELER PROFILE:
- Style: ${travelStyle}
- Interests: ${interests.join(", ")}

DEFINITION OF "HIDDEN GEM":
- Not in mainstream travel guides or top-10 lists
- Loved by locals, not marketed to tourists
- Specific enough to be actionable (real name, real address)
- Includes insider context that makes you feel like a local

CATEGORIES to cover across 8 gems (mix based on interests):
restaurant, bar, viewpoint, market, neighbourhood, experience, nature, cultural

Return this exact JSON:
{
  "destination": "${destination}",
  "gems": [
    {
      "id": "gem_1",
      "name": "Exact real name",
      "category": "restaurant|bar|viewpoint|market|neighbourhood|experience|nature|cultural",
      "description": "2-3 sentences on what makes this special",
      "why_hidden": "Why tourists miss this — specific backstory",
      "best_time": "Tuesday evenings after 8pm",
      "address": "Full street address",
      "lat": <accurate number>,
      "lng": <accurate number>,
      "cost": <integer per person USD, 0 if free>,
      "insider_tip": "One specific thing only a local would tell you",
      "interests": ["food", "culture"],
      "avoid_if": "You need English menus everywhere"
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}`;
}

// ─── 5. Chat system prompt ────────────────────────────────────────────────────

export function buildChatSystemPrompt(
  itinerary: GeneratedItinerary,
  inputs: TripInputs
): string {
  const daysSummary = itinerary.days
    .map((d) => `Day ${d.dayNumber} (${d.date}, ${d.theme}): ${d.activities.map((a) => a.name).join(", ")} | Meals: ${d.meals.map((m) => m.name).join(", ")}`)
    .join("\n");

  return `You are a brilliant personal travel concierge for a trip to ${itinerary.destination}.

TRIP CONTEXT:
- Dates: ${inputs.startDate} to ${inputs.endDate}
- Travelers: ${inputs.travelers} (${inputs.travelStyle} style)
- Budget: $${inputs.budget} total
- Interests: ${inputs.interests.join(", ")}
- Currency: ${itinerary.currency}

CURRENT ITINERARY:
${daysSummary}

YOUR ROLE:
- Answer questions about the destination with local knowledge
- Suggest alternatives or additions when asked
- Help with logistics (getting around, best routes, timing)
- Find restaurants, bars, experiences based on preferences
- Warn about common tourist mistakes for this destination
- Always be specific — real names, real addresses, real costs

RESPONSE FORMAT:
- Keep responses concise and conversational (2-4 paragraphs max)
- Use bullet points for lists of recommendations
- Include practical details (hours, costs, booking tips)
- End with 2-3 suggested follow-up questions as "actions" array

Respond in this JSON format:
{
  "content": "Your conversational response here",
  "actions": [
    { "type": "find_alternatives", "label": "Show me cheaper options" },
    { "type": "show_on_map",       "label": "Where is this exactly?" }
  ]
}`;
}
