// lib/ai/providers/types.ts
// ─── AI Provider Contract ─────────────────────────────────────────────────────
// Defines the interface that every AI provider MUST implement.
// Adding Anthropic, Gemini, or a local model = implement this + register below.

import { TripInputs, GeneratedItinerary } from "@/types";

export interface AIProvider {
  readonly name: string;
  generateItinerary(inputs: TripInputs): Promise<GeneratedItinerary>;
}

// ─── Validated itinerary shape ────────────────────────────────────────────────
// Used to guard against malformed AI responses before they reach the client.

export interface RawAIItinerary {
  destination: string;
  summary: string;
  totalCost: number;
  currency?: string;
  days: RawAIDay[];
}

export interface RawAIDay {
  dayNumber: number;
  date: string;
  theme: string;
  summary: string;
  estimatedCost: number;
  activities: RawAIActivity[];
  meals: RawAIMeal[];
  transport: RawAITransport[];
}

export interface RawAIActivity {
  id: string;
  name: string;
  description: string;
  category: string;
  startTime: string;
  endTime: string;
  duration: number;
  cost: number;
  address?: string;
  lat?: number;
  lng?: number;
  tips?: string;
}

export interface RawAIMeal {
  id: string;
  name: string;
  type: string;
  cuisine: string;
  description: string;
  priceRange: string;
  cost: number;
  address?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  tips?: string;
}

export interface RawAITransport {
  id: string;
  type: string;
  from: string;
  to: string;
  duration: number;
  cost: number;
  notes?: string;
}
