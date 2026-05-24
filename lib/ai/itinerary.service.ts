// lib/ai/itinerary.service.ts
// ─── AI Itinerary Service ─────────────────────────────────────────────────────
// Public façade over the generation engine + mock provider.
// Components and API routes import ONLY from here — never from engine/ directly.

import type { TripInputs, GeneratedItinerary } from "@/types";
import { serverConfig } from "@/lib/config/env";
import { generateItineraryWithAI } from "./engine/generator";
import { MockProvider } from "./providers/mock.provider";

export async function generateItinerary(
  inputs: TripInputs
): Promise<GeneratedItinerary> {
  if (serverConfig.openaiApiKey) {
    return generateItineraryWithAI(inputs);
  }

  if (serverConfig.isDev) {
    console.warn(
      "[AI Service] OPENAI_API_KEY not set — using mock provider.\n" +
      "Add your key to .env.local to enable real AI generation."
    );
  }

  return new MockProvider().generateItinerary(inputs);
}
