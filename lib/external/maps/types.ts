// lib/external/maps/types.ts
// ─── Google Maps API Type Definitions ────────────────────────────────────────

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface GeocodedPlace {
  placeId: string;
  formattedAddress: string;
  location: GeoLocation;
  types: string[];
  viewport?: {
    northeast: GeoLocation;
    southwest: GeoLocation;
  };
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: GeoLocation;
  rating?: number;
  totalRatings?: number;
  priceLevel?: 0 | 1 | 2 | 3 | 4; // 0=free, 4=very expensive
  phone?: string;
  website?: string;
  openingHours?: {
    openNow: boolean;
    weekdayText: string[];
    periods?: OpeningPeriod[];
  };
  photos?: PlacePhoto[];
  types: string[];
  vicinity?: string;
  internationalPhone?: string;
  url?: string; // Google Maps URL
}

export interface OpeningPeriod {
  open: { day: number; time: string };
  close?: { day: number; time: string };
}

export interface PlacePhoto {
  reference: string;
  width: number;
  height: number;
  /** Full CDN URL (constructed by the adapter, not from Google) */
  url?: string;
}

export interface NearbyPlace {
  placeId: string;
  name: string;
  location: GeoLocation;
  rating?: number;
  totalRatings?: number;
  priceLevel?: number;
  types: string[];
  vicinity?: string;
  openNow?: boolean;
  photoReference?: string;
}

export interface DirectionsRoute {
  distance: { value: number; text: string }; // meters, "2.3 km"
  duration: { value: number; text: string }; // seconds, "12 mins"
  steps: DirectionsStep[];
  polyline: string; // encoded polyline
}

export interface DirectionsStep {
  instruction: string; // HTML
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  travelMode: string;
}

// Google Maps API raw response shapes (internal — not exported to consumers)

export interface GoogleGeocodeResponse {
  results: Array<{
    place_id: string;
    formatted_address: string;
    geometry: {
      location: { lat: number; lng: number };
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    types: string[];
  }>;
  status: string;
  error_message?: string;
}

export interface GooglePlacesSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    geometry: { location: { lat: number; lng: number } };
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    types: string[];
    vicinity?: string;
    opening_hours?: { open_now: boolean };
    photos?: Array<{ photo_reference: string; width: number; height: number }>;
  }>;
  status: string;
  error_message?: string;
}

export interface GooglePlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    url?: string;
    opening_hours?: {
      open_now: boolean;
      weekday_text: string[];
      periods?: Array<{
        open: { day: number; time: string };
        close?: { day: number; time: string };
      }>;
    };
    photos?: Array<{ photo_reference: string; width: number; height: number }>;
    types: string[];
    vicinity?: string;
  };
  status: string;
  error_message?: string;
}

// Price level mapping for display
export const PRICE_LEVEL_MAP: Record<number, string> = {
  0: "Free",
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};
