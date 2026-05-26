// lib/config/env.ts
// ─── Centralised Environment Configuration ────────────────────────────────────
// Single source of truth for ALL environment variables.
// Never read process.env directly outside this file.
// Getter pattern means: validation runs lazily (at first access per request),
// not at module load — so the app boots even without all optional vars.

function requireServerEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Required env var missing: ${key}\n` +
      `Add it to .env.local. See .env.example for the full list.`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return isNaN(n) ? fallback : n;
}

// ─── Server-only config ───────────────────────────────────────────────────────

export const serverConfig = {
  // ── Runtime ───────────────────────────────────────────────────────────────
  get nodeEnv(): "development" | "production" | "test" {
    const e = optionalEnv("NODE_ENV", "development");
    if (e === "production" || e === "test") return e;
    return "development";
  },
  get isDev(): boolean { return this.nodeEnv === "development"; },
  get isProd(): boolean { return this.nodeEnv === "production"; },

  // ── Database ──────────────────────────────────────────────────────────────
  get databaseUrl(): string { return requireServerEnv("DATABASE_URL"); },

  // ── OpenAI ────────────────────────────────────────────────────────────────
  get openaiApiKey(): string | null { return process.env.OPENAI_API_KEY ?? null; },
  get openaiModel(): string { return optionalEnv("OPENAI_MODEL", "gpt-4o"); },
  get openaiOrg(): string | null { return process.env.OPENAI_ORG_ID ?? null; },

  // ── Google APIs (server-side only — unrestricted key) ────────────────────
  get googleApiKey(): string | null { return process.env.GOOGLE_API_KEY ?? null; },

  // ── Weather API (Open-Meteo is free, no key needed — but AccuWeather needs one) ──
  get weatherApiKey(): string | null { return process.env.WEATHER_API_KEY ?? null; },

  // ── AI Engine Config ──────────────────────────────────────────────────────
  ai: {
    maxTokens: 8000,
    temperature: 0.7,
    timeoutMs: 90_000, // 90s — complex itineraries can be slow
    maxRetries: 3,
    maxTripDays: 14,
    // Cost guardrails
    maxBudgetUSD: 1_000_000,
    minBudgetUSD: 100,
  },

  // ── External APIs ─────────────────────────────────────────────────────────
  externalApis: {
    googleMaps: {
      timeoutMs: 8_000,
      maxRetries: 2,
    },
    weather: {
      baseUrl: "https://api.open-meteo.com/v1",
      timeoutMs: 5_000,
      maxRetries: 2,
      cacheTtlMs: 3 * 60 * 60 * 1000, // 3 hours
    },
    geocoding: {
      cacheTtlMs: 24 * 60 * 60 * 1000, // 24 hours — coords don't change
    },
    places: {
      cacheTtlMs: 30 * 60 * 1000, // 30 min
      maxResults: 5,
    },
  },

  // ── Rate limiting ─────────────────────────────────────────────────────────
  // Plug into Upstash Redis for production enforcement
  rateLimit: {
    itinerary: {
      requestsPerMinute: optionalInt("RATE_LIMIT_ITINERARY_PER_MIN", 5),
      requestsPerHour: optionalInt("RATE_LIMIT_ITINERARY_PER_HOUR", 20),
    },
    places: {
      requestsPerMinute: optionalInt("RATE_LIMIT_PLACES_PER_MIN", 30),
    },
  },
} as const;

// ─── Public config (NEXT_PUBLIC_ prefix — safe for client bundle) ─────────────

export const publicConfig = {
  appUrl: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  // Restricted browser key (HTTP referrer locked in Google Cloud Console)
  googleMapsApiKey: optionalEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
  appName: "Voyage AI",
  appTagline: "Plan smarter. Travel deeper.",
} as const;
