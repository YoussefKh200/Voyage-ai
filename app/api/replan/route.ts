import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { replanItinerary } from "@/lib/ai/features/service";
import { toApiError, Errors } from "@/lib/errors";
import { itineraryLimiter, getRequestIdentifier, rateLimitHeaders } from "@/lib/ratelimit";
import { serverConfig } from "@/lib/config/env";
import type { ReplanRequest } from "@/types";

const Schema = z.object({
  itinerary:    z.record(z.string(), z.unknown()),
  inputs:       z.record(z.string(), z.unknown()),
  trigger:      z.enum(["weather", "budget", "crowd", "closed", "custom"]),
  reason:       z.string().min(3).max(300),
  affectedDays: z.array(z.number().int().min(1)).optional(),
});

export async function POST(req: NextRequest) {
  const id = getRequestIdentifier(req);
  const rl = itineraryLimiter.check(id);
  const headers = rateLimitHeaders(rl);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited", code: "RATE_LIMITED" }, { status: 429, headers });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json(Errors.validation("Invalid JSON").toJSON(), { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400, headers });

  try {
    const reqData = parsed.data as unknown as ReplanRequest;
    const result = await replanItinerary(reqData);
    return NextResponse.json({ success: true, data: result }, { headers });
  } catch (err) {
    const e = toApiError(err);
    if (e.statusCode >= 500 && serverConfig.isProd) return NextResponse.json({ error: "Replan failed." }, { status: 500, headers });
    return NextResponse.json(e, { status: e.statusCode, headers });
  }
}
export const dynamic = "force-dynamic";
