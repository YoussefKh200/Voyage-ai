// app/api/places/route.ts
// ─── GET /api/places ──────────────────────────────────────────────────────────
// Proxies Google Places searches server-side so the unrestricted GOOGLE_API_KEY
// is never exposed to the browser. The client uses NEXT_PUBLIC key for Maps JS
// display only; all data fetching goes through this route.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { textSearchPlaces, searchNearby } from "@/lib/external/maps/places";
import { toApiError } from "@/lib/errors";

const QuerySchema = z.object({
  query: z.string().min(1).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  type: z.string().optional(),
  radius: z.coerce.number().min(100).max(50000).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = QuerySchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lng: searchParams.get("lng") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    radius: searchParams.get("radius") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { query, lat, lng, type, radius } = parsed.data;

  try {
    let result;

    if (query) {
      const location = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
      result = await textSearchPlaces(query, location);
    } else if (lat !== undefined && lng !== undefined) {
      result = await searchNearby({ lat, lng, type, radius });
    } else {
      return NextResponse.json(
        { error: "Provide either `query` or `lat`+`lng`" },
        { status: 400 }
      );
    }

    if (!result.ok) {
      const status = result.error.status ?? 500;
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status }
      );
    }

    return NextResponse.json({
      data: result.data,
      cached: result.cached,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    const apiErr = toApiError(err);
    return NextResponse.json(apiErr, { status: apiErr.statusCode });
  }
}

export const dynamic = "force-dynamic";
