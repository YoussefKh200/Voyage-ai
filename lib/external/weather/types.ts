// lib/external/weather/types.ts
// ─── Weather API Types ────────────────────────────────────────────────────────

export interface DailyWeather {
  date: string; // YYYY-MM-DD
  tempMaxC: number;
  tempMinC: number;
  tempMaxF: number;
  tempMinF: number;
  precipitationMm: number;
  precipitationProbability: number; // 0–100
  windSpeedKph: number;
  uvIndex: number;
  weatherCode: WeatherCode;
  condition: WeatherCondition;
  icon: string; // emoji
  description: string;
  sunrise?: string; // HH:MM
  sunset?: string;
}

export interface TripWeatherForecast {
  destination: string;
  lat: number;
  lng: number;
  unit: "celsius" | "fahrenheit";
  days: DailyWeather[];
  generatedAt: string;
  source: "open-meteo";
}

// WMO Weather Code — Open-Meteo standard
export type WeatherCode =
  | 0   // Clear sky
  | 1 | 2 | 3         // Mainly clear, partly cloudy, overcast
  | 45 | 48           // Fog
  | 51 | 53 | 55      // Drizzle
  | 61 | 63 | 65      // Rain
  | 71 | 73 | 75      // Snow
  | 77                // Snow grains
  | 80 | 81 | 82      // Rain showers
  | 85 | 86           // Snow showers
  | 95                // Thunderstorm
  | 96 | 99           // Thunderstorm with hail
  | number;           // fallback

export type WeatherCondition =
  | "sunny"
  | "partly_cloudy"
  | "cloudy"
  | "foggy"
  | "drizzle"
  | "rainy"
  | "snowy"
  | "stormy"
  | "unknown";

// Open-Meteo raw API response
export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    windspeed_10m_max: number[];
    uv_index_max: number[];
    weathercode: number[];
    sunrise?: string[];
    sunset?: string[];
  };
}
