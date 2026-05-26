// lib/ratelimit/index.ts
// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// Token bucket algorithm — smoother than fixed window, prevents burst abuse.
//
// Current: in-process Map (works for single-instance deployments, Vercel Edge).
// Production scale: swap the store for Upstash Redis by implementing RateLimitStore.
// The RateLimiter class is unchanged — only the store swaps.
//
// Usage in API routes:
//   const result = await itineraryLimiter.check(req);
//   if (!result.allowed) return NextResponse.json(..., { status: 429 });

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix ms
  limit: number;
}

interface RateLimitStore {
  get(key: string): { tokens: number; lastRefill: number } | undefined;
  set(key: string, value: { tokens: number; lastRefill: number }): void;
}

class InProcessStore implements RateLimitStore {
  private store = new Map<string, { tokens: number; lastRefill: number }>();

  get(key: string) { return this.store.get(key); }
  set(key: string, value: { tokens: number; lastRefill: number }) {
    this.store.set(key, value);
    // Prevent unbounded growth — evict entries older than 1 hour
    if (this.store.size > 10_000) {
      const cutoff = Date.now() - 60 * 60 * 1000;
      for (const [k, v] of this.store) {
        if (v.lastRefill < cutoff) this.store.delete(k);
      }
    }
  }
}

interface RateLimiterConfig {
  /** Max requests per window */
  limit: number;
  /** Window duration in ms */
  windowMs: number;
  /** Namespace to prevent collisions between different limiters */
  namespace: string;
}

class RateLimiter {
  private store: RateLimitStore;
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig, store: RateLimitStore = new InProcessStore()) {
    this.config = config;
    this.store = store;
  }

  check(identifier: string): RateLimitResult {
    const key = `${this.config.namespace}:${identifier}`;
    const now = Date.now();
    const { limit, windowMs } = this.config;

    const entry = this.store.get(key) ?? { tokens: limit, lastRefill: now };

    // Refill tokens proportionally to elapsed time
    const elapsed = now - entry.lastRefill;
    const refillAmount = (elapsed / windowMs) * limit;
    const tokens = Math.min(limit, entry.tokens + refillAmount);

    if (tokens < 1) {
      const resetAt = entry.lastRefill + windowMs;
      return { allowed: false, remaining: 0, resetAt, limit };
    }

    const newTokens = tokens - 1;
    this.store.set(key, { tokens: newTokens, lastRefill: now });

    return {
      allowed: true,
      remaining: Math.floor(newTokens),
      resetAt: now + windowMs,
      limit,
    };
  }
}

// ─── Named limiters ───────────────────────────────────────────────────────────

export const itineraryLimiter = new RateLimiter({
  namespace: "itinerary",
  limit: 10,
  windowMs: 60 * 60 * 1000, // 10 per hour
});

export const placesLimiter = new RateLimiter({
  namespace: "places",
  limit: 60,
  windowMs: 60 * 1000, // 60 per minute
});

export const weatherLimiter = new RateLimiter({
  namespace: "weather",
  limit: 30,
  windowMs: 60 * 1000,
});

// ─── Helper: extract identifier from request ──────────────────────────────────
// Uses IP from x-forwarded-for (Vercel/proxy) or x-real-ip, falls back to "unknown".
// In production: combine with user ID when auth is added.

export function getRequestIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

// ─── Rate limit response headers ─────────────────────────────────────────────

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) }),
  };
}
