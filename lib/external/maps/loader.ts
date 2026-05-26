// lib/external/maps/loader.ts
// ─── Google Maps JavaScript API Loader ───────────────────────────────────────
// Loads the Maps JS SDK once per page lifecycle. Idempotent — safe to call
// multiple times; returns the same promise on subsequent calls.
// Uses the modern 'importLibrary' API (Maps JS v3.55+).

import { publicConfig } from "@/lib/config/env";

type GoogleMapsStatus = "idle" | "loading" | "ready" | "error";

let status: GoogleMapsStatus = "idle";
let loadPromise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (status === "ready") return Promise.resolve();
  if (loadPromise) return loadPromise;

  const apiKey = publicConfig.googleMapsApiKey;
  if (!apiKey) {
    status = "error";
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set"));
  }

  status = "loading";

  loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Maps can only be loaded in the browser"));
      return;
    }

    // Avoid double-loading if already on the page
    if (window.google?.maps) {
      status = "ready";
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      status = "ready";
      resolve();
    };

    script.onerror = () => {
      status = "error";
      loadPromise = null;
      reject(new Error("Failed to load Google Maps JavaScript API"));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isGoogleMapsReady(): boolean {
  return status === "ready" && typeof window !== "undefined" && !!window.google?.maps;
}

// Augment global Window type
declare global {
  interface Window {
    google?: {
      maps?: object;
    };
  }
}
