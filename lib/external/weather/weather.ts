// lib/external/weather/weather.ts
// ─── Open-Meteo Weather Adapter ───────────────────────────────────────────────
// Open-Meteo is free, no API key required, GDPR-compliant.
// https://open-meteo.com/
//
// Forecast available up to 16 days ahead. Historical data available separately.
// Cached per lat/lng rounded to 2dp (≈1km precision) for 3 hours.

import { serverConfig } from "@/lib/config/env";
import { weatherCache, weatherCacheKey } from "@/lib/cache/lru";
import { withRetry, FetchError } from "@/lib/external/core/retry";
import { ok, err, type Result } from "@/lib/external/core/result";
import type {
  TripWeatherForecast,
  DailyWeather,
  WeatherCode,
  WeatherCondition,
  OpenMeteoForecastResponse,
} from "./types";

const SERVICE = "open-meteo";
const BASE_URL = "https://api.open-meteo.com/v1";

// ─── WMO code interpreter ─────────────────────────────────────────────────────

interface WeatherMeta {
  condition: WeatherCondition;
  icon: string;
  description: string;
}

function interpretWeatherCode(code: WeatherCode): WeatherMeta {
  if (code === 0) return { condition: "sunny", icon: "☀️", description: "Clear sky" };
  if (code <= 2) return { condition: "partly_cloudy", icon: "⛅", description: "Partly cloudy" };
  if (code === 3) return { condition: "cloudy", icon: "☁️", description: "Overcast" };
  if (code <= 48) return { condition: "foggy", icon: "🌫️", description: "Foggy" };
  if (code <= 55) return { condition: "drizzle", icon: "🌦️", description: "Drizzle" };
  if (code <= 65) return { condition: "rainy", icon: "🌧️", description: "Rain" };
  if (code <= 77) return { condition: "snowy", icon: "❄️", description: "Snow" };
  if (code <= 82) return { condition: "rainy", icon: "🌦️", description: "Rain showers" };
  if (code <= 86) return { condition: "snowy", icon: "🌨️", description: "Snow showers" };
  if (code >= 95) return { condition: "stormy", icon: "⛈️", description: "Thunderstorm" };
  return { condition: "unknown", icon: "🌡️", description: "Unknown" };
}

function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

// ─── Main adapter ─────────────────────────────────────────────────────────────

export async function getTripWeather(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
  destinationName: string
): Promise<Result<TripWeatherForecast>> {
  const cacheKey = weatherCacheKey(lat, lng) + `:${startDate}:${endDate}`;
  const cached = weatherCache.get(cacheKey) as TripWeatherForecast | undefined;
  if (cached) return ok(cached, true);

  const start = Date.now();

  return withRetry(
    async () => {
      const url = new URL(`${BASE_URL}/forecast`);
      url.searchParams.set("latitude", lat.toFixed(4));
      url.searchParams.set("longitude", lng.toFixed(4));
      url.searchParams.set("start_date", startDate);
      url.searchParams.set("end_date", endDate);
      url.searchParams.set("daily", [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "precipitation_probability_max",
        "windspeed_10m_max",
        "uv_index_max",
        "weathercode",
        "sunrise",
        "sunset",
      ].join(","));
      url.searchParams.set("timezone", "auto"); // resolve from coords
      url.searchParams.set("forecast_days", "16");

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(serverConfig.externalApis.weather.timeoutMs),
      });

      if (!response.ok) {
        throw new FetchError(`Weather API HTTP error`, response.status);
      }

      const data = (await response.json()) as OpenMeteoForecastResponse;
      const daily = data.daily;

      if (!daily?.time?.length) {
        throw new FetchError("Weather API returned empty daily data");
      }

      const days: DailyWeather[] = daily.time.map((date, i) => {
        const code = (daily.weathercode[i] ?? 0) as WeatherCode;
        const meta = interpretWeatherCode(code);
        const maxC = Math.round(daily.temperature_2m_max[i] ?? 0);
        const minC = Math.round(daily.temperature_2m_min[i] ?? 0);

        const sunriseRaw = daily.sunrise?.[i];
        const sunsetRaw = daily.sunset?.[i];

        return {
          date,
          tempMaxC: maxC,
          tempMinC: minC,
          tempMaxF: celsiusToFahrenheit(maxC),
          tempMinF: celsiusToFahrenheit(minC),
          precipitationMm: Math.round((daily.precipitation_sum[i] ?? 0) * 10) / 10,
          precipitationProbability: daily.precipitation_probability_max[i] ?? 0,
          windSpeedKph: Math.round(daily.windspeed_10m_max[i] ?? 0),
          uvIndex: Math.round(daily.uv_index_max[i] ?? 0),
          weatherCode: code,
          ...meta,
          sunrise: sunriseRaw ? sunriseRaw.split("T")[1]?.slice(0, 5) : undefined,
          sunset: sunsetRaw ? sunsetRaw.split("T")[1]?.slice(0, 5) : undefined,
        };
      });

      const forecast: TripWeatherForecast = {
        destination: destinationName,
        lat,
        lng,
        unit: "celsius",
        days,
        generatedAt: new Date().toISOString(),
        source: "open-meteo",
      };

      weatherCache.set(cacheKey, forecast, serverConfig.externalApis.weather.cacheTtlMs);
      return ok(forecast, false, Date.now() - start);
    },
    {
      maxAttempts: serverConfig.externalApis.weather.maxRetries,
      isRetryable: (e) =>
        e instanceof FetchError && (e.status === undefined || e.status >= 500),
      onRetry: (attempt, _, delay) =>
        console.warn(`[Weather] Retry ${attempt} in ${delay}ms`),
    }
  ).catch((e) => {
    return err<TripWeatherForecast>({
      code: "SERVICE_UNAVAILABLE",
      message: `Weather API unavailable: ${(e as Error).message}`,
      service: SERVICE,
      retryable: true,
    });
  });
}

// ─── Weather summary for itinerary enrichment ────────────────────────────────
// Called by the itinerary page to add weather context to each day.

export function getWeatherSummary(weather: DailyWeather): string {
  const tempStr = `${weather.tempMinC}–${weather.tempMaxC}°C`;
  const rainStr =
    weather.precipitationProbability > 30
      ? ` · ${weather.precipitationProbability}% chance of rain`
      : "";
  return `${weather.icon} ${weather.description}, ${tempStr}${rainStr}`;
}
