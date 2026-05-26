// lib/services/trip.service.ts
// ─── Trip & Itinerary DB Service ─────────────────────────────────────────────
// Abstracts all database operations. Business logic lives here, not in routes.
// This layer makes it easy to add caching, logging, or multi-tenancy later.

import { db } from "./db";
import { TripInputs, GeneratedItinerary } from "@/types";

// ─── Create a trip from user inputs ──────────────────────────────────────────

export async function createTrip(inputs: TripInputs) {
  return db.trip.create({
    data: {
      destination: inputs.destination,
      startDate: new Date(inputs.startDate),
      endDate: new Date(inputs.endDate),
      budget: inputs.budget,
      travelers: inputs.travelers,
      travelStyle: inputs.travelStyle,
      interests: inputs.interests,
    },
  });
}

// ─── Persist the generated itinerary to the DB ───────────────────────────────

export async function saveItinerary(
  tripId: string,
  itinerary: GeneratedItinerary
) {
  return db.itinerary.create({
    data: {
      tripId,
      summary: itinerary.summary,
      totalCost: itinerary.totalCost,
      currency: itinerary.currency,
      days: {
        create: itinerary.days.map((day) => ({
          dayNumber: day.dayNumber,
          date: new Date(day.date),
          theme: day.theme,
          summary: day.summary,
          estimatedCost: day.estimatedCost,
          activities: {
            create: day.activities.map((a) => ({
              name: a.name,
              description: a.description,
              category: a.category,
              startTime: a.startTime,
              endTime: a.endTime,
              duration: a.duration,
              cost: a.cost,
              address: a.address,
              lat: a.lat,
              lng: a.lng,
              tips: a.tips,
            })),
          },
          meals: {
            create: day.meals.map((m) => ({
              name: m.name,
              type: m.type,
              cuisine: m.cuisine,
              description: m.description,
              priceRange: m.priceRange,
              cost: m.cost,
              address: m.address,
              lat: m.lat,
              lng: m.lng,
              rating: m.rating,
              tips: m.tips,
            })),
          },
          transport: {
            create: day.transport.map((t) => ({
              type: t.type,
              from: t.from,
              to: t.to,
              duration: t.duration,
              cost: t.cost,
              notes: t.notes,
            })),
          },
        })),
      },
    },
    include: {
      days: {
        include: { activities: true, meals: true, transport: true },
      },
    },
  });
}

// ─── Fetch a trip with its full itinerary ────────────────────────────────────

export async function getTripWithItinerary(tripId: string) {
  return db.trip.findUnique({
    where: { id: tripId },
    include: {
      itinerary: {
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: {
              activities: { orderBy: { startTime: "asc" } },
              meals: true,
              transport: true,
            },
          },
        },
      },
    },
  });
}

// ─── List recent trips (future: filter by userId) ────────────────────────────

export async function getRecentTrips(limit = 10) {
  return db.trip.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { itinerary: { select: { summary: true, totalCost: true } } },
  });
}

// ─── Delete a trip and cascade everything ────────────────────────────────────

export async function deleteTrip(tripId: string) {
  return db.trip.delete({ where: { id: tripId } });
}
