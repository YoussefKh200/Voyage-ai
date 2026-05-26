// app/api/itinerary/route.ts — Production-hardened itinerary API route
import { NextRequest, NextResponse } from "next/server";
import { generateItinerary } from "@/lib/ai/itinerary.service";
import { TripInputsSchema } from "@/lib/schemas/trip.schema";
import { toApiError, Errors, isAppError } from "@/lib/errors";
import { serverConfig } from "@/lib/config/env";
import { itineraryLimiter, getRequestIdentifier, rateLimitHeaders } from "@/lib/ratelimit";
import { logger, LogEvent } from "@/lib/logger";
import { captureError } from "@/lib/monitoring";
import { validateUserInput, detectSSRF } from "@/lib/security";

export async function POST(req: NextRequest) {
  const identifier = getRequestIdentifier(req);
  const requestId  = req.headers.get("x-request-id") ?? identifier;
  const log        = logger.forRequest(requestId, "/api/itinerary", "POST");

  // ── Rate limiting ────────────────────────────────────────────────────────────
  const rateResult = itineraryLimiter.check(identifier);
  const rlHeaders  = rateLimitHeaders(rateResult);

  if (!rateResult.allowed) {
    logger.warn(LogEvent.API_RATE_LIMITED, { requestId, identifier, route: "/api/itinerary" });
    return NextResponse.json(
      { error: "Too many requests. Please wait before generating another itinerary.", code: "RATE_LIMITED" },
      { status: 429, headers: rlHeaders }
    );
  }

  // ── Parse body ───────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(Errors.validation("Invalid JSON").toJSON(), { status: 400, headers: rlHeaders });
  }

  // ── Validate inputs ──────────────────────────────────────────────────────────
  const parsed = TripInputsSchema.safeParse((body as Record<string, unknown>)?.inputs);
  if (!parsed.success) {
    return NextResponse.json(
      { ...Errors.validation(parsed.error.issues.map((i) => i.message).join("; ")).toJSON(), details: parsed.error.flatten() },
      { status: 400, headers: rlHeaders }
    );
  }

  const { data: inputs } = parsed;

  // ── Security checks ──────────────────────────────────────────────────────────
  const destCheck = validateUserInput(inputs.destination, "destination", requestId);
  if (!destCheck.safe) {
    return NextResponse.json(Errors.validation(destCheck.reason ?? "Invalid destination").toJSON(), { status: 400, headers: rlHeaders });
  }

  if (detectSSRF(inputs.destination)) {
    logger.warn(LogEvent.SEC_SUSPICIOUS_INPUT, { requestId, field: "destination" });
    return NextResponse.json(Errors.validation("Invalid destination").toJSON(), { status: 400, headers: rlHeaders });
  }

  // ── Business rules ───────────────────────────────────────────────────────────
  if (inputs.endDate < inputs.startDate) {
    return NextResponse.json(Errors.validation("End date must be after start date", "endDate").toJSON(), { status: 400, headers: rlHeaders });
  }

  const tripDays = Math.round((new Date(inputs.endDate).getTime() - new Date(inputs.startDate).getTime()) / 86_400_000) + 1;
  if (tripDays > serverConfig.ai.maxTripDays) {
    return NextResponse.json(Errors.validation(`Trip cannot exceed ${serverConfig.ai.maxTripDays} days`).toJSON(), { status: 400, headers: rlHeaders });
  }

  // ── Generate ─────────────────────────────────────────────────────────────────
  try {
    const itinerary = await generateItinerary(inputs, requestId);
    log.info(LogEvent.API_RESPONSE, { status: 200, destination: inputs.destination });
    return NextResponse.json({ success: true, data: itinerary }, { headers: rlHeaders });
  } catch (err) {
    captureError(err, { requestId, route: "/api/itinerary", destination: inputs.destination });

    const apiError = toApiError(err);
    if (apiError.statusCode >= 500 && serverConfig.isProd) {
      return NextResponse.json({ error: "An unexpected error occurred. Please try again.", code: "UNKNOWN_ERROR" }, { status: 500, headers: rlHeaders });
    }
    return NextResponse.json(apiError, { status: apiError.statusCode, headers: rlHeaders });
  }
}

export const dynamic = "force-dynamic";
