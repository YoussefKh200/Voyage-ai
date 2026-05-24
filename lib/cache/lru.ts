// lib/cache/lru.ts
// ─── In-Process LRU Cache ─────────────────────────────────────────────────────
// Used by all external API adapters. At scale, replace CacheStore implementation
// with Redis/Upstash while keeping the same interface for zero caller changes.

import { LRUCache } from "lru-cache";

// ─── Provider-agnostic interface ──────────────────────────────────────────────

export interface CacheStore<T = unknown> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
  has(key: string): boolean;
}

// ─── LRU implementation ───────────────────────────────────────────────────────

class LRUStore<T extends object = object> implements CacheStore<T> {
  private cache: LRUCache<string, T>;

  constructor(maxItems = 500, defaultTtlMs = 5 * 60 * 1000) {
    this.cache = new LRUCache<string, T>({
      max: maxItems,
      ttl: defaultTtlMs,
    });
  }

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.cache.set(key, value, ttlMs ? { ttl: ttlMs } : undefined);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// ─── Named caches (separate TTLs per data domain) ────────────────────────────

const globalCaches = new Map<string, LRUStore>();

function getCache(name: string, maxItems = 500, ttlMs = 5 * 60 * 1000): CacheStore {
  if (!globalCaches.has(name)) {
    globalCaches.set(name, new LRUStore(maxItems, ttlMs));
  }
  return globalCaches.get(name)!;
}

export const placesCache = getCache("places", 1000, 30 * 60 * 1000);
export const geocodeCache = getCache("geocode", 2000, 24 * 60 * 60 * 1000);
export const weatherCache = getCache("weather", 200, 3 * 60 * 60 * 1000);
export const itineraryCache = getCache("itinerary", 50, 60 * 60 * 1000);

// ─── Cache key builders ───────────────────────────────────────────────────────

export function placeCacheKey(query: string, location?: string): string {
  return `place:${location ? `${location.toLowerCase()}:` : ""}${query.toLowerCase().trim()}`;
}

export function geocodeCacheKey(address: string): string {
  return `geo:${address.toLowerCase().trim()}`;
}

export function weatherCacheKey(lat: number, lng: number): string {
  return `weather:${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export function itineraryCacheKey(inputs: {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  travelStyle: string;
  interests: string[];
}): string {
  const sorted = [...inputs.interests].sort().join(",");
  return `itinerary:${inputs.destination.toLowerCase()}:${inputs.startDate}:${inputs.endDate}:${inputs.budget}:${inputs.travelers}:${inputs.travelStyle}:${sorted}`;
}
