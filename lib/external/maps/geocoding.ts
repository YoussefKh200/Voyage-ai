// lib/external/maps/geocoding.ts
// ─── Google Geocoding Adapter ─────────────────────────────────────────────────
// Converts addresses/place names to lat/lng coordinates.
// Cached aggressively (24h) — coordinates never change.

import { serverConfig } from "@/lib/config/env";
import { geocodeCache, geocodeCacheKey } from "@/lib/cache/lru";
import { withRetry, FetchError } from "@/lib/external/core/retry";
import { ok, err, classifyHttpError, type Result } from "@/lib/external/core/result";
import type { GeocodedPlace, GoogleGeocodeResponse } from "./types";

const SERVICE = "google-geocoding";
const BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

// ─── Main adapter function ────────────────────────────────────────────────────

export async function geocodeAddress(
  address: string
): Promise<Result<GeocodedPlace>> {
  const apiKey = serverConfig.googleApiKey;
  if (!apiKey) {
    return err({
      code: "UNAUTHORIZED",
      message: "GOOGLE_API_KEY not configured",
      service: SERVICE,
      retryable: false,
    });
  }

  const cacheKey = geocodeCacheKey(address);
  const cached = geocodeCache.get(cacheKey) as GeocodedPlace | undefined;
  if (cached) {
    return ok(cached, true);
  }

  const start = Date.now();

  return withRetry(
    async (attempt) => {
      const url = new URL(BASE_URL);
      url.searchParams.set("address", address);
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(serverConfig.externalApis.googleMaps.timeoutMs),
      });

      if (!response.ok) {
        throw new FetchError(`Geocoding HTTP error`, response.status);
      }

      const data = (await response.json()) as GoogleGeocodeResponse;

      if (data.status === "ZERO_RESULTS") {
        return err<GeocodedPlace>({
          code: "NOT_FOUND",
          message: `No geocoding results for: ${address}`,
          service: SERVICE,
          retryable: false,
        });
      }

      if (data.status !== "OK") {
        throw new FetchError(
          data.error_message ?? `Geocoding API error: ${data.status}`
        );
      }

      const first = data.results[0];
      if (!first) {
        return err<GeocodedPlace>({
          code: "NOT_FOUND",
          message: "Empty results array",
          service: SERVICE,
          retryable: false,
        });
      }

      const place: GeocodedPlace = {
        placeId: first.place_id,
        formattedAddress: first.formatted_address,
        location: {
          lat: first.geometry.location.lat,
          lng: first.geometry.location.lng,
        },
        types: first.types,
        viewport: {
          northeast: first.geometry.viewport.northeast,
          southwest: first.geometry.viewport.southwest,
        },
      };

      geocodeCache.set(cacheKey, place);

      return ok(place, false, Date.now() - start);
    },
    {
      maxAttempts: serverConfig.externalApis.googleMaps.maxRetries,
      isRetryable: (e) =>
        e instanceof FetchError && (e.status === undefined || e.status >= 500),
      onRetry: (attempt, _, delay) =>
        console.warn(`[Geocoding] Retry ${attempt} for "${address}" in ${delay}ms`),
    }
  ).catch((e) => {
    const status = e instanceof FetchError ? e.status : undefined;
    return err<GeocodedPlace>(classifyHttpError(SERVICE, status ?? 500, e.message));
  });
}

// ─── Reverse geocoding (coords → address) ────────────────────────────────────

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<Result<GeocodedPlace>> {
  const latlng = `${lat},${lng}`;
  return geocodeAddress(latlng);
}

// ─── Destination bounding box ─────────────────────────────────────────────────
// Used to bias Places searches to the correct city/region.

export async function getDestinationBounds(destination: string): Promise<
  Result<{
    location: { lat: number; lng: number };
    viewport?: { northeast: { lat: number; lng: number }; southwest: { lat: number; lng: number } };
  }>
> {
  const result = await geocodeAddress(destination);
  if (!result.ok) return result;

  return ok({
    location: result.data.location,
    viewport: result.data.viewport,
  });
}
