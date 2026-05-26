// lib/hooks/useItineraryCosts.ts
// ─── Itinerary Cost Computation Hook ─────────────────────────────────────────
// Problem: CostBreakdown was re-computing totals inline on every render.
// Solution: useMemo + typed return so any future cost-aware component is consistent.
// This is also the place to add currency conversion in future.

import { useMemo } from "react";
import type { GeneratedItinerary, ItineraryCostBreakdown } from "@/types";

export function useItineraryCosts(
  itinerary: GeneratedItinerary,
  travelers: number
): ItineraryCostBreakdown {
  return useMemo(() => {
    const activities = itinerary.days.reduce(
      (sum, day) =>
        sum + day.activities.reduce((s, a) => s + a.cost * travelers, 0),
      0
    );

    const meals = itinerary.days.reduce(
      (sum, day) =>
        sum + day.meals.reduce((s, m) => s + m.cost * travelers, 0),
      0
    );

    // Transport costs are already for the group
    const transport = itinerary.days.reduce(
      (sum, day) =>
        sum + day.transport.reduce((s, t) => s + t.cost, 0),
      0
    );

    const total = itinerary.totalCost;
    const perPerson = travelers > 0 ? Math.round(total / travelers) : total;

    return { activities, meals, transport, total, perPerson };
  }, [itinerary, travelers]);
}
