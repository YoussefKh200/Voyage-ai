// lib/ai/itinerary.service.ts
import type { TripInputs, GeneratedItinerary } from "@/types";
import { serverConfig } from "@/lib/config/env";
import { generateItineraryWithAI } from "./engine/generator";
import { MockProvider } from "./providers/mock.provider";

export async function generateItinerary(
  inputs: TripInputs,
  requestId?: string
): Promise<GeneratedItinerary> {
  if (serverConfig.openaiApiKey) {
    return generateItineraryWithAI(inputs, requestId);
  }
  if (serverConfig.isDev) {
    console.warn("[AI Service] No OPENAI_API_KEY — using mock provider");
  }
  return new MockProvider().generateItinerary(inputs);
}
