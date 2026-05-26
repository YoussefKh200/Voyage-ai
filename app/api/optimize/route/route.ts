import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { optimizeRoute } from "@/lib/ai/features/service";
import { toApiError } from "@/lib/errors";
import { itineraryLimiter, getRequestIdentifier, rateLimitHeaders } from "@/lib/ratelimit";
import type { RouteOptimizationRequest } from "@/types";

const Schema = z.object({
  itinerary: z.record(z.string(), z.unknown()),
  inputs:    z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const id = getRequestIdentifier(req);
  const rl = itineraryLimiter.check(id);
  const headers = rateLimitHeaders(rl);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const result = await optimizeRoute(parsed.data as unknown as RouteOptimizationRequest);
    return NextResponse.json({ success: true, data: result }, { headers });
  } catch (err) {
    const e = toApiError(err);
    return NextResponse.json(e, { status: e.statusCode, headers });
  }
}
export const dynamic = "force-dynamic";
