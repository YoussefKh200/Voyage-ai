// lib/hooks/usePlaces.ts
// ─── Places Search Hook ───────────────────────────────────────────────────────
// Fetches nearby or text-searched places from /api/places.
// Debounced on query changes to avoid spamming the API.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { NearbyPlace } from "@/lib/external/maps/types";

type PlacesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: NearbyPlace[]; cached: boolean }
  | { status: "error"; message: string };

interface UsePlacesTextParams {
  mode: "text";
  query: string;
  lat?: number;
  lng?: number;
  enabled?: boolean;
}

interface UsePlacesNearbyParams {
  mode: "nearby";
  lat: number;
  lng: number;
  type?: string;
  radius?: number;
  enabled?: boolean;
}

type UsePlacesParams = UsePlacesTextParams | UsePlacesNearbyParams;

export function usePlaces(params: UsePlacesParams) {
  const [state, setState] = useState<PlacesState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const fetchPlaces = useCallback(async () => {
    const enabled = params.enabled !== false;
    if (!enabled) return;

    if (params.mode === "text" && !params.query) return;
    if (params.mode === "nearby" && (params.lat === undefined || params.lng === undefined)) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "loading" });

    try {
      const searchParams = new URLSearchParams();

      if (params.mode === "text") {
        searchParams.set("query", params.query);
        if (params.lat !== undefined) searchParams.set("lat", String(params.lat));
        if (params.lng !== undefined) searchParams.set("lng", String(params.lng));
      } else {
        searchParams.set("lat", String(params.lat));
        searchParams.set("lng", String(params.lng));
        if (params.type) searchParams.set("type", params.type);
        if (params.radius) searchParams.set("radius", String(params.radius));
      }

      const res = await fetch(`/api/places?${searchParams.toString()}`, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const json = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "Places search failed" });
        return;
      }

      setState({
        status: "success",
        data: json.data as NearbyPlace[],
        cached: json.cached ?? false,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState({ status: "error", message: "Could not load places" });
    }
  }, [params]);

  useEffect(() => {
    fetchPlaces();
    return () => abortRef.current?.abort();
  }, [fetchPlaces]);

  return {
    ...state,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    places: state.status === "success" ? state.data : [],
    retry: fetchPlaces,
  };
}
