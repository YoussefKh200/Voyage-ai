// lib/schemas/trip.schema.ts
// ─── Trip Validation Schema ───────────────────────────────────────────────────
// Single source of truth used by:
//  1. API route (server-side validation)
//  2. usePlannerNavigation (client-side step gating)
// Note: Uses Zod v4 API (z.number({ error }) instead of { invalid_type_error })

import { z } from "zod";

export const MAX_TRIP_DAYS = 14;

// ─── Individual field schemas ─────────────────────────────────────────────────

const destinationSchema = z
  .string()
  .min(2, "Destination must be at least 2 characters")
  .max(100, "Destination too long")
  .trim();

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format");

const budgetSchema = z
  .number({ error: "Budget must be a number" })
  .min(100, "Budget must be at least $100")
  .max(1_000_000, "Budget too large");

const travelersSchema = z
  .number()
  .int()
  .min(1, "At least 1 traveler required")
  .max(50, "Maximum 50 travelers");

const travelStyleSchema = z.enum(["budget", "comfort", "luxury"]);

const interestSchema = z.enum([
  "food",
  "nightlife",
  "museums",
  "shopping",
  "adventure",
  "nature",
  "luxury",
]);

const interestsSchema = z
  .array(interestSchema)
  .min(1, "Select at least one interest")
  .max(7);

// ─── Per-step partial schemas (for client-side step gating) ──────────────────

export const Step1Schema = z
  .object({
    destination: destinationSchema,
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "Return date must be after departure date",
    path: ["endDate"],
  })
  .refine(
    (d) => {
      const days =
        Math.round(
          (new Date(d.endDate).getTime() - new Date(d.startDate).getTime()) /
            86_400_000
        ) + 1;
      return days <= MAX_TRIP_DAYS;
    },
    { message: `Trip cannot exceed ${MAX_TRIP_DAYS} days`, path: ["endDate"] }
  );

export const Step2Schema = z.object({
  budget: budgetSchema,
  travelers: travelersSchema,
  travelStyle: travelStyleSchema,
});

export const Step3Schema = z.object({
  interests: interestsSchema,
});

// ─── Full schema (used by API route) ─────────────────────────────────────────

export const TripInputsSchema = z
  .object({
    destination: destinationSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    budget: budgetSchema,
    travelers: travelersSchema,
    travelStyle: travelStyleSchema,
    interests: interestsSchema,
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "Return date must be after departure date",
    path: ["endDate"],
  });

export type TripInputs = z.infer<typeof TripInputsSchema>;
