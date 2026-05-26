// types/index.ts
// ─── Application Type Definitions ────────────────────────────────────────────
// Organised by domain: Trip → Itinerary → API → UI
// Rule: Types derived from Zod schemas live in schemas/ and are re-exported here
//       so the rest of the app has a single import point.

// ─── Re-export from schema (single source of truth for input types) ───────────
export type { TripInputs } from "@/lib/schemas/trip.schema";

// ─── Domain: Travel preferences ──────────────────────────────────────────────

export type TravelStyle = "budget" | "comfort" | "luxury";

export type Interest =
  | "food"
  | "nightlife"
  | "museums"
  | "shopping"
  | "adventure"
  | "nature"
  | "luxury";

export type MealType = "breakfast" | "lunch" | "dinner";
export type PriceRange = "$" | "$$" | "$$$" | "$$$$";
export type TransportType = "taxi" | "metro" | "walk" | "bus" | "ferry" | "train";
export type ActivityCategory =
  | "museum"
  | "attraction"
  | "adventure"
  | "shopping"
  | "nature"
  | "nightlife"
  | "food";

// ─── Domain: Generated Itinerary ─────────────────────────────────────────────

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface GeneratedActivity {
  id: string;
  name: string;
  description: string;
  category: string; // ActivityCategory | string — AI may return unexpected values
  startTime: string; // "HH:MM"
  endTime: string;
  duration: number; // minutes
  cost: number; // per person, USD
  address?: string;
  lat?: number;
  lng?: number;
  tips?: string;
  imageUrl?: string;
}

export interface GeneratedMeal {
  id: string;
  name: string;
  type: MealType;
  cuisine: string;
  description: string;
  priceRange: PriceRange;
  cost: number; // per person, USD
  address?: string;
  lat?: number;
  lng?: number;
  rating?: number; // 0–5
  tips?: string;
}

export interface GeneratedTransport {
  id: string;
  type: TransportType;
  from: string;
  to: string;
  duration: number; // minutes
  cost: number; // total for group, USD
  notes?: string;
}

export interface GeneratedDay {
  dayNumber: number;
  date: string; // "YYYY-MM-DD"
  theme: string;
  summary: string;
  estimatedCost: number; // USD, group total
  activities: GeneratedActivity[];
  meals: GeneratedMeal[];
  transport: GeneratedTransport[];
}

export interface GeneratedItinerary {
  tripId: string;
  destination: string;
  summary: string;
  totalCost: number;
  currency: string;
  days: GeneratedDay[];
  generatedAt: string; // ISO timestamp
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface GenerateItineraryRequest {
  inputs: import("@/lib/schemas/trip.schema").TripInputs;
}

export interface GenerateItineraryResponse {
  success: boolean;
  data?: GeneratedItinerary;
  error?: string;
  code?: string; // ErrorCode from lib/errors
}

// ─── UI state ─────────────────────────────────────────────────────────────────

/** Valid planner step numbers */
export type PlannerStep = 1 | 2 | 3 | 4;

/** Derived cost totals used in CostBreakdown — pre-computed, not re-derived in render */
export interface ItineraryCostBreakdown {
  activities: number;
  meals: number;
  transport: number;
  total: number;
  perPerson: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WOW FEATURES — Extended types
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. AI Replanning ─────────────────────────────────────────────────────────

export type ReplanTrigger =
  | "weather"       // bad weather on specific day
  | "budget"        // over budget
  | "crowd"         // venue too crowded
  | "closed"        // venue closed
  | "custom";       // user-specified reason

export interface ReplanRequest {
  itinerary: GeneratedItinerary;
  inputs: import("@/lib/schemas/trip.schema").TripInputs;
  trigger: ReplanTrigger;
  reason: string;           // human-readable: "Rain forecast on day 2"
  affectedDays?: number[];  // which day numbers to replan (empty = all)
}

export interface ReplanResponse {
  success: boolean;
  itinerary?: GeneratedItinerary;
  changes?: ReplanChange[];
  error?: string;
}

export interface ReplanChange {
  dayNumber: number;
  type: "activity_swapped" | "meal_swapped" | "route_changed" | "day_restructured";
  description: string;
}

// ─── 2. Budget Optimization ───────────────────────────────────────────────────

export interface BudgetOptimizationRequest {
  itinerary: GeneratedItinerary;
  inputs: import("@/lib/schemas/trip.schema").TripInputs;
  targetReductionPercent: number;   // 10–50%
  priorities: BudgetPriority[];     // what to preserve
}

export type BudgetPriority =
  | "keep_restaurants"
  | "keep_activities"
  | "keep_accommodation_quality"
  | "keep_signature_experiences";

export interface BudgetSaving {
  category: "meal" | "activity" | "transport" | "accommodation";
  dayNumber: number;
  original: { name: string; cost: number };
  replacement: { name: string; cost: number };
  saving: number;
  tradeoff: string; // "Slightly less central location but great reviews"
}

export interface BudgetOptimizationResult {
  originalTotal: number;
  optimizedTotal: number;
  savedAmount: number;
  savedPercent: number;
  savings: BudgetSaving[];
  itinerary: GeneratedItinerary;
}

// ─── 3. Route Optimization ────────────────────────────────────────────────────

export interface RouteOptimizationRequest {
  itinerary: GeneratedItinerary;
  inputs: import("@/lib/schemas/trip.schema").TripInputs;
}

export interface RouteIssue {
  dayNumber: number;
  severity: "minor" | "major";
  description: string;               // "30-min backtrack between Museum and Market"
  wastedMinutes: number;
}

export interface RouteOptimizationResult {
  issues: RouteIssue[];
  totalWastedMinutesBefore: number;
  totalWastedMinutesAfter: number;
  minutesSaved: number;
  itinerary: GeneratedItinerary;
  explanation: string;
}

// ─── 4. Hidden Gems ──────────────────────────────────────────────────────────

export type GemCategory =
  | "restaurant"
  | "bar"
  | "viewpoint"
  | "market"
  | "neighbourhood"
  | "experience"
  | "nature"
  | "cultural";

export interface HiddenGem {
  id: string;
  name: string;
  category: GemCategory;
  description: string;         // why it's special, not touristy
  why_hidden: string;          // the insider backstory
  best_time: string;           // "Tuesday evenings", "Early morning"
  address?: string;
  lat?: number;
  lng?: number;
  cost: number;                // per person USD
  insider_tip: string;
  interests: string[];         // which interests this serves
  avoid_if: string;            // "You hate crowds" / "Not for light walkers"
}

export interface HiddenGemsResult {
  destination: string;
  gems: HiddenGem[];
  generatedAt: string;
}

// ─── 5. AI Chat ──────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  actions?: ChatAction[];   // suggested follow-ups
}

export type ChatActionType =
  | "add_to_day"
  | "replace_activity"
  | "find_alternatives"
  | "show_on_map"
  | "replan_day"
  | "optimize_budget";

export interface ChatAction {
  type: ChatActionType;
  label: string;
  payload?: Record<string, unknown>;
}

export interface ChatRequest {
  messages: Array<{ role: ChatRole; content: string }>;
  itinerary: GeneratedItinerary;
  inputs: import("@/lib/schemas/trip.schema").TripInputs;
  stream?: boolean;
}
