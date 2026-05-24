// lib/external/maps/places.ts
// ─── Google Places Adapter ────────────────────────────────────────────────────
// Provides: nearby search, place details, text search, photo URL builder.
// All calls return Result<T> — never throws. Cached at the adapter level.

import { serverConfig } from "@/lib/config/env";
import { placesCache, placeCacheKey } from "@/lib/cache/lru";
import { withRetry, FetchError } from "@/lib/external/core/retry";
import { ok, err, classifyHttpError, type Result } from "@/lib/external/core/result";
import type {
  NearbyPlace,
  PlaceDetails,
  PlacePhoto,
  GooglePlacesSearchResponse,
  GooglePlaceDetailsResponse,
} from "./types";

const SERVICE = "google-places";
const BASE_URL = "https://maps.googleapis.com/maps/api/place";

// ─── Photo URL builder ────────────────────────────────────────────────────────

export function buildPhotoUrl(photoReference: string, maxWidth = 800): string {
  const apiKey = serverConfig.googleApiKey ?? "";
  return `${BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
}

// ─── Nearby search ────────────────────────────────────────────────────────────
// Find places near a location filtered by type.

export interface NearbySearchOptions {
  lat: number;
  lng: number;
  radius?: number; // meters, default 1500
  type?: string; // restaurant, tourist_attraction, museum, etc.
  keyword?: string; // additional keyword filter
  maxResults?: number;
}

export async function searchNearby(
  options: NearbySearchOptions
): Promise<Result<NearbyPlace[]>> {
  const apiKey = serverConfig.googleApiKey;
  if (!apiKey) {
    return err({
      code: "UNAUTHORIZED",
      message: "GOOGLE_API_KEY not configured",
      service: SERVICE,
      retryable: false,
    });
  }

  const {
    lat,
    lng,
    radius = 1500,
    type,
    keyword,
    maxResults = serverConfig.externalApis.places.maxResults,
  } = options;

  const cacheKey = placeCacheKey(
    `nearby:${type ?? ""}:${keyword ?? ""}`,
    `${lat.toFixed(3)},${lng.toFixed(3)}`
  );

  const cached = placesCache.get(cacheKey) as NearbyPlace[] | undefined;
  if (cached) return ok(cached, true);

  const start = Date.now();

  return withRetry(
    async () => {
      const url = new URL(`${BASE_URL}/nearbysearch/json`);
      url.searchParams.set("location", `${lat},${lng}`);
      url.searchParams.set("radius", String(radius));
      url.searchParams.set("key", apiKey);
      if (type) url.searchParams.set("type", type);
      if (keyword) url.searchParams.set("keyword", keyword);

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(serverConfig.externalApis.googleMaps.timeoutMs),
      });

      if (!response.ok) {
        throw new FetchError("Places search HTTP error", response.status);
      }

      const data = (await response.json()) as GooglePlacesSearchResponse;

      if (data.status === "ZERO_RESULTS") {
        const empty: NearbyPlace[] = [];
        placesCache.set(cacheKey, empty);
        return ok(empty, false, Date.now() - start);
      }

      if (data.status !== "OK") {
        throw new FetchError(
          data.error_message ?? `Places API: ${data.status}`
        );
      }

      const places: NearbyPlace[] = data.results
        .slice(0, maxResults)
        .map((r) => ({
          placeId: r.place_id,
          name: r.name,
          location: {
            lat: r.geometry.location.lat,
            lng: r.geometry.location.lng,
          },
          rating: r.rating,
          totalRatings: r.user_ratings_total,
          priceLevel: r.price_level,
          types: r.types,
          vicinity: r.vicinity,
          openNow: r.opening_hours?.open_now,
          photoReference: r.photos?.[0]?.photo_reference,
        }));

      placesCache.set(cacheKey, places);
      return ok(places, false, Date.now() - start);
    },
    {
      maxAttempts: serverConfig.externalApis.googleMaps.maxRetries,
      isRetryable: (e) =>
        e instanceof FetchError && (e.status === undefined || e.status >= 500),
    }
  ).catch((e) => {
    const status = e instanceof FetchError ? e.status : undefined;
    return err<NearbyPlace[]>(classifyHttpError(SERVICE, status ?? 500, e.message));
  });
}

// ─── Text search ──────────────────────────────────────────────────────────────
// Best for searching by name: "Eiffel Tower Paris", "Blue Bottle Coffee Tokyo"

export async function textSearchPlaces(
  query: string,
  location?: { lat: number; lng: number }
): Promise<Result<NearbyPlace[]>> {
  const apiKey = serverConfig.googleApiKey;
  if (!apiKey) {
    return err({
      code: "UNAUTHORIZED",
      message: "GOOGLE_API_KEY not configured",
      service: SERVICE,
      retryable: false,
    });
  }

  const cacheKey = placeCacheKey(query, location ? `${location.lat.toFixed(3)},${location.lng.toFixed(3)}` : undefined);
  const cached = placesCache.get(cacheKey) as NearbyPlace[] | undefined;
  if (cached) return ok(cached, true);

  const start = Date.now();

  return withRetry(async () => {
    const url = new URL(`${BASE_URL}/textsearch/json`);
    url.searchParams.set("query", query);
    url.searchParams.set("key", apiKey);
    if (location) {
      url.searchParams.set("location", `${location.lat},${location.lng}`);
      url.searchParams.set("radius", "5000");
    }

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(serverConfig.externalApis.googleMaps.timeoutMs),
    });

    if (!response.ok) throw new FetchError("Places text search error", response.status);

    const data = (await response.json()) as GooglePlacesSearchResponse;

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new FetchError(data.error_message ?? `Places API: ${data.status}`);
    }

    const places: NearbyPlace[] = (data.results ?? []).slice(0, 5).map((r) => ({
      placeId: r.place_id,
      name: r.name,
      location: { lat: r.geometry.location.lat, lng: r.geometry.location.lng },
      rating: r.rating,
      totalRatings: r.user_ratings_total,
      priceLevel: r.price_level,
      types: r.types,
      vicinity: r.vicinity,
      openNow: r.opening_hours?.open_now,
      photoReference: r.photos?.[0]?.photo_reference,
    }));

    placesCache.set(cacheKey, places);
    return ok(places, false, Date.now() - start);
  }).catch((e) => {
    return err<NearbyPlace[]>(classifyHttpError(SERVICE, (e as FetchError).status ?? 500, e.message));
  });
}

// ─── Place details ────────────────────────────────────────────────────────────
// Full details for a single place (opening hours, phone, photos, etc.)

export async function getPlaceDetails(
  placeId: string
): Promise<Result<PlaceDetails>> {
  const apiKey = serverConfig.googleApiKey;
  if (!apiKey) {
    return err({
      code: "UNAUTHORIZED",
      message: "GOOGLE_API_KEY not configured",
      service: SERVICE,
      retryable: false,
    });
  }

  const cacheKey = `place-details:${placeId}`;
  const cached = placesCache.get(cacheKey) as PlaceDetails | undefined;
  if (cached) return ok(cached, true);

  const FIELDS = [
    "place_id", "name", "formatted_address", "geometry",
    "rating", "user_ratings_total", "price_level",
    "formatted_phone_number", "international_phone_number",
    "website", "url", "opening_hours", "photos", "types", "vicinity",
  ].join(",");

  const start = Date.now();

  return withRetry(async () => {
    const url = new URL(`${BASE_URL}/details/json`);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", FIELDS);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(serverConfig.externalApis.googleMaps.timeoutMs),
    });

    if (!response.ok) throw new FetchError("Place details HTTP error", response.status);

    const data = (await response.json()) as GooglePlaceDetailsResponse;

    if (data.status !== "OK") {
      throw new FetchError(data.error_message ?? `Place details API: ${data.status}`, data.status === "NOT_FOUND" ? 404 : 500);
    }

    const r = data.result;
    const photos: PlacePhoto[] = (r.photos ?? []).slice(0, 5).map((p) => ({
      reference: p.photo_reference,
      width: p.width,
      height: p.height,
      url: buildPhotoUrl(p.photo_reference),
    }));

    const details: PlaceDetails = {
      placeId: r.place_id,
      name: r.name,
      formattedAddress: r.formatted_address,
      location: { lat: r.geometry.location.lat, lng: r.geometry.location.lng },
      rating: r.rating,
      totalRatings: r.user_ratings_total,
      priceLevel: r.price_level as PlaceDetails["priceLevel"],
      phone: r.formatted_phone_number,
      internationalPhone: r.international_phone_number,
      website: r.website,
      url: r.url,
      openingHours: r.opening_hours
        ? {
            openNow: r.opening_hours.open_now,
            weekdayText: r.opening_hours.weekday_text,
            periods: r.opening_hours.periods,
          }
        : undefined,
      photos,
      types: r.types,
      vicinity: r.vicinity,
    };

    placesCache.set(cacheKey, details);
    return ok(details, false, Date.now() - start);
  }).catch((e) => {
    return err<PlaceDetails>(classifyHttpError(SERVICE, (e as FetchError).status ?? 500, e.message));
  });
}
