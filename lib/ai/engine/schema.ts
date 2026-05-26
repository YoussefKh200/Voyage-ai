// lib/ai/engine/schema.ts
// ─── AI Response Validation Schema ───────────────────────────────────────────
// This is the contract between the AI and the rest of the application.
// Every field is validated, coerced if safe, and given a sane default where
// the AI might legitimately omit it.
//
// Design rules:
//  - .coerce.number() for cost fields — AI sometimes returns "25" not 25
//  - .default() for optional structural fields (ids, currency)
//  - .min(1) on all strings — catch empty-string hallucinations
//  - Coordinates validated to be plausible world ranges
//  - No .catch() — we want to know when the AI returns garbage, not silently
//    swallow it (the retry logic in the engine handles recovery)

import { z } from "zod";
import { generateId } from "@/lib/utils/string";

// ─── Coordinate validation ────────────────────────────────────────────────────

const latSchema = z.coerce
  .number()
  .min(-90, "Latitude must be ≥ -90")
  .max(90, "Latitude must be ≤ 90")
  .optional();

const lngSchema = z.coerce
  .number()
  .min(-180, "Longitude must be ≥ -180")
  .max(180, "Longitude must be ≤ 180")
  .optional();

// ─── Time validation ──────────────────────────────────────────────────────────

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Must be HH:MM")
  .refine((t) => {
    const [h, m] = t.split(":").map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }, "Invalid time value");

// ─── Cost: coerce string→number, ensure non-negative ─────────────────────────

const costSchema = z.coerce.number().int().min(0);

// ─── Activity ─────────────────────────────────────────────────────────────────

export const ActivitySchema = z.object({
  id: z
    .string()
    .min(1)
    .default(() => `act_${generateId()}`),
  name: z.string().min(1, "Activity name required"),
  description: z.string().min(10, "Description too short"),
  category: z
    .enum(["museum", "attraction", "adventure", "shopping", "nature", "nightlife", "food"])
    .default("attraction"),
  startTime: timeSchema,
  endTime: timeSchema,
  duration: z.coerce.number().int().min(0).max(720), // max 12 hours per activity
  cost: costSchema,
  address: z.string().min(1).optional(),
  lat: latSchema,
  lng: lngSchema,
  tips: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

// ─── Meal ─────────────────────────────────────────────────────────────────────

export const MealSchema = z.object({
  id: z
    .string()
    .min(1)
    .default(() => `meal_${generateId()}`),
  name: z.string().min(1, "Restaurant name required"),
  type: z.enum(["breakfast", "lunch", "dinner"]),
  cuisine: z.string().min(1).default("Local"),
  description: z.string().min(10, "Description too short"),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).default("$$"),
  cost: costSchema,
  address: z.string().min(1).optional(),
  lat: latSchema,
  lng: lngSchema,
  rating: z.coerce.number().min(1).max(5).optional(),
  tips: z.string().optional(),
});

// ─── Transport ────────────────────────────────────────────────────────────────

export const TransportSchema = z.object({
  id: z
    .string()
    .min(1)
    .default(() => `trans_${generateId()}`),
  type: z.enum(["taxi", "metro", "walk", "bus", "ferry", "train"]).default("taxi"),
  from: z.string().min(1),
  to: z.string().min(1),
  duration: z.coerce.number().int().min(0).max(480),
  cost: costSchema,
  notes: z.string().optional(),
});

// ─── Day ──────────────────────────────────────────────────────────────────────

export const DaySchema = z.object({
  dayNumber: z.coerce.number().int().min(1).max(14),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  theme: z.string().min(3, "Theme too short").max(60, "Theme too long"),
  summary: z.string().min(10, "Summary too short"),
  estimatedCost: costSchema,
  activities: z.array(ActivitySchema).min(1, "Each day needs at least 1 activity").max(8),
  meals: z.array(MealSchema).min(1, "Each day needs at least 1 meal").max(4),
  transport: z.array(TransportSchema).max(6).default([]),
});

// ─── Full itinerary ───────────────────────────────────────────────────────────

export const ItinerarySchema = z.object({
  destination: z.string().min(1),
  summary: z.string().min(20, "Summary too short — needs more context"),
  totalCost: costSchema,
  currency: z.string().length(3).default("USD"),
  days: z.array(DaySchema).min(1).max(14),
});

export type ValidatedItinerary = z.infer<typeof ItinerarySchema>;
export type ValidatedDay = z.infer<typeof DaySchema>;
export type ValidatedActivity = z.infer<typeof ActivitySchema>;
export type ValidatedMeal = z.infer<typeof MealSchema>;
export type ValidatedTransport = z.infer<typeof TransportSchema>;

// ─── Validation with detailed diagnostics ────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  data?: ValidatedItinerary;
  issues: Array<{ path: string; message: string }>;
}

export function validateItineraryResponse(raw: unknown): ValidationResult {
  const result = ItinerarySchema.safeParse(raw);

  if (result.success) {
    return { valid: true, data: result.data, issues: [] };
  }

  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return { valid: false, issues };
}
