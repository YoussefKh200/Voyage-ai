// app/api/gems/route.ts — POST /api/gems
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { discoverHiddenGems } from "@/lib/ai/features/service";
import { toApiError } from "@/lib/errors";
import { placesLimiter, getRequestIdentifier, rateLimitHeaders } from "@/lib/ratelimit";
import { itineraryCache } from "@/lib/cache/lru";

const Schema = z.object({
  destination:  z.string().min(2).max(100),
  interests:    z.array(z.string()).min(1),
  travelStyle:  z.enum(["budget", "comfort", "luxury"]),
});

export async function POST(req: NextRequest) {
  const id = getRequestIdentifier(req);
  const rl = placesLimiter.check(id);
  const headers = rateLimitHeaders(rl);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });

  const { destination, interests, travelStyle } = parsed.data;
  const cacheKey = `gems:${destination.toLowerCase()}:${travelStyle}:${[...interests].sort().join(",")}`;
  const cached = itineraryCache.get(cacheKey);
  if (cached) return NextResponse.json({ success: true, data: cached, cached: true }, { headers });

  try {
    const result = await discoverHiddenGems(destination, interests, travelStyle);
    itineraryCache.set(cacheKey, result);
    return NextResponse.json({ success: true, data: result }, { headers });
  } catch (err) {
    const e = toApiError(err);
    return NextResponse.json(e, { status: e.statusCode, headers });
  }
}
export const dynamic = "force-dynamic";
