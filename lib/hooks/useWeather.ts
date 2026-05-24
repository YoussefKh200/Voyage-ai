// lib/hooks/useWeather.ts
// ─── Weather Data Hook ────────────────────────────────────────────────────────
// Fetches weather from /api/weather for a trip's destination + dates.
// Gracefully degrades — weather is informational, never blocks the main UI.

"use client";

import { useState, useEffect, useCallback } from "react";
import type { TripWeatherForecast } from "@/lib/external/weather/types";

type WeatherState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TripWeatherForecast; cached: boolean }
  | { status: "error"; message: string };

interface UseWeatherParams {
  destination: string;
  startDate: string;
  endDate: string;
  lat?: number;
  lng?: number;
  enabled?: boolean;
}

export function useWeather({
  destination,
  startDate,
  endDate,
  lat,
  lng,
  enabled = true,
}: UseWeatherParams) {
  const [state, setState] = useState<WeatherState>({ status: "idle" });

  const fetch_ = useCallback(async () => {
    if (!destination || !startDate || !endDate || !enabled) return;

    setState({ status: "loading" });

    try {
      const params = new URLSearchParams({
        destination,
        startDate,
        endDate,
        ...(lat !== undefined ? { lat: String(lat) } : {}),
        ...(lng !== undefined ? { lng: String(lng) } : {}),
      });

      const res = await fetch(`/api/weather?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.data) {
        setState({
          status: "error",
          message: json.error ?? "Weather data unavailable",
        });
        return;
      }

      setState({
        status: "success",
        data: json.data as TripWeatherForecast,
        cached: json.cached ?? false,
      });
    } catch {
      setState({ status: "error", message: "Could not load weather data" });
    }
  }, [destination, startDate, endDate, lat, lng, enabled]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return {
    ...state,
    isLoading: state.status === "loading",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    data: state.status === "success" ? state.data : undefined,
    retry: fetch_,
  };
}
