// lib/ai/providers/response.schema.ts
// ─── AI Response Validation Schema ───────────────────────────────────────────
// Parses and validates the raw JSON the AI returns.
// If the AI hallucinates a wrong shape, we catch it here — not in the UI.
// Uses .coerce where sensible (AI sometimes returns costs as strings).

import { z } from "zod";

const AIActivitySchema = z.object({
  id: z.string().default(() => `act_${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().default("attraction"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  duration: z.coerce.number().int().min(0),
  cost: z.coerce.number().min(0),
  address: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  tips: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const AIMealSchema = z.object({
  id: z.string().default(() => `meal_${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().min(1),
  type: z.enum(["breakfast", "lunch", "dinner"]).default("lunch"),
  cuisine: z.string().default("Local"),
  description: z.string().min(1),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).default("$$"),
  cost: z.coerce.number().min(0),
  address: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  tips: z.string().optional(),
});

const AITransportSchema = z.object({
  id: z.string().default(() => `trans_${Math.random().toString(36).slice(2, 7)}`),
  type: z
    .enum(["taxi", "metro", "walk", "bus", "ferry", "train"])
    .default("taxi"),
  from: z.string().min(1),
  to: z.string().min(1),
  duration: z.coerce.number().int().min(0),
  cost: z.coerce.number().min(0),
  notes: z.string().optional(),
});

const AIDaySchema = z.object({
  dayNumber: z.coerce.number().int().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  theme: z.string().min(1),
  summary: z.string().min(1),
  estimatedCost: z.coerce.number().min(0),
  activities: z.array(AIActivitySchema).default([]),
  meals: z.array(AIMealSchema).default([]),
  transport: z.array(AITransportSchema).default([]),
});

export const AIResponseSchema = z.object({
  destination: z.string().min(1),
  summary: z.string().min(1),
  totalCost: z.coerce.number().min(0),
  currency: z.string().default("USD"),
  days: z.array(AIDaySchema).min(1),
});

export type ValidatedAIResponse = z.infer<typeof AIResponseSchema>;
