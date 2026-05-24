// app/api/itinerary/route.ts
// ─── POST /api/itinerary ──────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { generateItinerary } from "@/lib/ai/itinerary.service";
import { TripInputsSchema } from "@/lib/schemas/trip.schema";
import { toApiError, Errors, isAppError } from "@/lib/errors";
import { serverConfig } from "@/lib/config/env";
import {
  itineraryLimiter,
  getRequestIdentifier,
  rateLimitHeaders,
} from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const identifier = getRequestIdentifier(req);
  const rateResult = itineraryLimiter.check(identifier);
  const rlHeaders = rateLimitHeaders(rateResult);

  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before generating another itinerary.", code: "RATE_LIMITED" },
      { status: 429, headers: rlHeaders }
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const e = Errors.validation("Request body must be valid JSON");
    return NextResponse.json(e.toJSON(), { status: 400, headers: rlHeaders });
  }

  // ── Validate inputs ────────────────────────────────────────────────────────
  const parsed = TripInputsSchema.safeParse(
    (body as Record<string, unknown>)?.inputs
  );
  if (!parsed.success) {
    const e = Errors.validation(
      parsed.error.issues.map((i) => i.message).join("; ")
    );
    return NextResponse.json(
      { ...e.toJSON(), details: parsed.error.flatten() },
      { status: 400, headers: rlHeaders }
    );
  }

  const { data: inputs } = parsed;

  // ── Business rules (cross-field, beyond Zod) ───────────────────────────────
  if (inputs.endDate < inputs.startDate) {
    return NextResponse.json(
      Errors.validation("End date must be on or after start date", "endDate").toJSON(),
      { status: 400, headers: rlHeaders }
    );
  }

  const tripDays =
    Math.round(
      (new Date(inputs.endDate).getTime() - new Date(inputs.startDate).getTime()) /
        86_400_000
    ) + 1;

  if (tripDays > serverConfig.ai.maxTripDays) {
    return NextResponse.json(
      Errors.validation(`Trip cannot exceed ${serverConfig.ai.maxTripDays} days`).toJSON(),
      { status: 400, headers: rlHeaders }
    );
  }

  // ── Generate ───────────────────────────────────────────────────────────────
  try {
    const itinerary = await generateItinerary(inputs);
    return NextResponse.json(
      { success: true, data: itinerary },
      { headers: rlHeaders }
    );
  } catch (err) {
    console.error("[POST /api/itinerary]", {
      error: err instanceof Error ? err.message : String(err),
      code: isAppError(err) ? err.code : "UNKNOWN",
      destination: inputs.destination,
      identifier,
    });

    const apiError = toApiError(err);

    if (apiError.statusCode >= 500 && serverConfig.isProd) {
      return NextResponse.json(
        { error: "An unexpected error occurred. Please try again.", code: "UNKNOWN_ERROR" },
        { status: 500, headers: rlHeaders }
      );
    }

    return NextResponse.json(apiError, { status: apiError.statusCode, headers: rlHeaders });
  }
}

export const dynamic = "force-dynamic";
