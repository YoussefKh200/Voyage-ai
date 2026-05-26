// app/api/weather/route.ts
// ─── GET /api/weather ─────────────────────────────────────────────────────────
// Returns weather forecast for a destination + date range.
// Requires geocoding the destination first if no coords are provided.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTripWeather } from "@/lib/external/weather/weather";
import { geocodeAddress } from "@/lib/external/maps/geocoding";
import { toApiError } from "@/lib/errors";

const QuerySchema = z.object({
  destination: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = QuerySchema.safeParse({
    destination: searchParams.get("destination"),
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
    lat: searchParams.get("lat") ?? undefined,
    lng: searchParams.get("lng") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { destination, startDate, endDate } = parsed.data;
  let { lat, lng } = parsed.data;

  try {
    // If no coordinates provided, geocode the destination
    if (lat === undefined || lng === undefined) {
      const geoResult = await geocodeAddress(destination);
      if (!geoResult.ok) {
        // Non-fatal — return a friendly error so the UI can degrade gracefully
        return NextResponse.json(
          {
            error: `Could not find coordinates for "${destination}"`,
            code: geoResult.error.code,
          },
          { status: 404 }
        );
      }
      lat = geoResult.data.location.lat;
      lng = geoResult.data.location.lng;
    }

    const weatherResult = await getTripWeather(lat, lng, startDate, endDate, destination);

    if (!weatherResult.ok) {
      // Weather is non-critical — return partial success with error info
      return NextResponse.json(
        {
          data: null,
          error: weatherResult.error.message,
          code: weatherResult.error.code,
          retryable: weatherResult.error.retryable,
        },
        { status: weatherResult.error.status ?? 503 }
      );
    }

    return NextResponse.json({
      data: weatherResult.data,
      cached: weatherResult.cached,
      latencyMs: weatherResult.latencyMs,
    });
  } catch (err) {
    const apiErr = toApiError(err);
    return NextResponse.json(apiErr, { status: apiErr.statusCode });
  }
}

export const dynamic = "force-dynamic";
