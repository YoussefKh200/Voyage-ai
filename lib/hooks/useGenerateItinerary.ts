// lib/hooks/useGenerateItinerary.ts — Updated to use GeneratingState
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  usePlannerStore, selectInputs, selectIsGenerating,
} from "@/lib/store/planner.store";
import { TripInputsSchema } from "@/lib/schemas/trip.schema";
import type { GenerateItineraryResponse } from "@/types";

const USER_FRIENDLY_ERRORS: Record<string, string> = {
  AI_TIMEOUT:       "AI took too long to respond. Please try again.",
  AI_PROVIDER_ERROR:"AI service is temporarily unavailable. Please try again in a moment.",
  RATE_LIMITED:     "You're generating trips too quickly. Please wait a moment.",
  VALIDATION_ERROR: "Some trip details look off. Please review your inputs.",
};

export function useGenerateItinerary() {
  const router       = useRouter();
  const inputs       = usePlannerStore(selectInputs);
  const isGenerating = usePlannerStore(selectIsGenerating);
  const { setIsGenerating, setItinerary, setError } = usePlannerStore();

  const generate = useCallback(async () => {
    if (isGenerating) return;

    const validated = TripInputsSchema.safeParse(inputs);
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? "Invalid trip inputs");
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Navigate to itinerary immediately to show the generating state
    router.push("/itinerary");

    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: validated.data }),
      });

      const json = (await res.json()) as GenerateItineraryResponse & { code?: string };

      if (!res.ok || !json.success) {
        const code    = json.code ?? "UNKNOWN_ERROR";
        const message = USER_FRIENDLY_ERRORS[code] ?? json.error ?? "Something went wrong.";
        setError(message);
        return;
      }

      if (!json.data) {
        setError("No itinerary received. Please try again.");
        return;
      }

      setItinerary(json.data);
    } catch (err) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      setError(
        isOffline
          ? "You appear to be offline. Please check your connection."
          : "Could not reach the server. Please try again."
      );
      console.error("[useGenerateItinerary]", err);
    } finally {
      setIsGenerating(false);
    }
  }, [inputs, isGenerating, setIsGenerating, setItinerary, setError, router]);

  return { generate, isGenerating };
}
