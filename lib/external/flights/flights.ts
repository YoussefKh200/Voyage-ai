// lib/external/flights/flights.ts
// ─── Flight Search Adapter ────────────────────────────────────────────────────
// Defines the typed interface for flight search with a clear extension point
// for plugging in Amadeus, Skyscanner, Duffel, or Google Flights.
//
// Currently returns a structured placeholder. To activate:
//  1. Get an Amadeus API key from https://developers.amadeus.com
//  2. Set AMADEUS_API_KEY and AMADEUS_API_SECRET in .env.local
//  3. Uncomment the AmadeusProvider implementation below

import { serverConfig } from "@/lib/config/env";
import { ok, err, type Result } from "@/lib/external/core/result";

const SERVICE = "flights";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlightSearchParams {
  origin: string; // IATA code e.g. "JFK"
  destination: string; // IATA code e.g. "CDG"
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  adults: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  currency?: string;
}

export interface FlightOffer {
  id: string;
  airline: string;
  airlineCode: string;
  outbound: FlightSegment[];
  inbound?: FlightSegment[];
  totalPriceUSD: number;
  pricePerPersonUSD: number;
  currency: string;
  cabin: string;
  baggage?: string;
  bookingUrl?: string;
  validUntil?: string;
}

export interface FlightSegment {
  departure: { airport: string; iata: string; datetime: string };
  arrival: { airport: string; iata: string; datetime: string };
  duration: string; // "PT7H30M" ISO 8601 duration
  flightNumber: string;
  aircraft?: string;
  stops: number;
}

export interface FlightSearchResult {
  searchId: string;
  params: FlightSearchParams;
  offers: FlightOffer[];
  cheapestUSD: number;
  fastestDurationMinutes: number;
  currency: string;
  searchedAt: string;
  source: string;
}

// ─── Provider interface ───────────────────────────────────────────────────────

interface FlightProvider {
  readonly name: string;
  search(params: FlightSearchParams): Promise<Result<FlightSearchResult>>;
}

// ─── Placeholder provider ─────────────────────────────────────────────────────
// Returns realistic-looking data so the UI can be built and tested
// before a real flight API subscription is purchased.

class PlaceholderProvider implements FlightProvider {
  readonly name = "placeholder";

  async search(params: FlightSearchParams): Promise<Result<FlightSearchResult>> {
    // Simulate API latency
    await new Promise((r) => setTimeout(r, 800));

    const basePrice = this.estimatePrice(params);
    const perPerson = Math.round(basePrice / params.adults);

    const offers: FlightOffer[] = [
      {
        id: `flight_1`,
        airline: "Air Europe",
        airlineCode: "AE",
        outbound: [
          {
            departure: { airport: "Origin Airport", iata: params.origin, datetime: `${params.departureDate}T08:00:00` },
            arrival: { airport: "Destination Airport", iata: params.destination, datetime: `${params.departureDate}T14:30:00` },
            duration: "PT6H30M",
            flightNumber: `AE${Math.floor(Math.random() * 9000 + 1000)}`,
            stops: 0,
          },
        ],
        totalPriceUSD: basePrice,
        pricePerPersonUSD: perPerson,
        currency: "USD",
        cabin: params.cabinClass ?? "economy",
        baggage: "1 carry-on included",
        bookingUrl: "https://example.com/book",
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `flight_2`,
        airline: "Global Airways",
        airlineCode: "GA",
        outbound: [
          {
            departure: { airport: "Origin Airport", iata: params.origin, datetime: `${params.departureDate}T11:00:00` },
            arrival: { airport: "Connecting Hub", iata: "HUB", datetime: `${params.departureDate}T14:00:00` },
            duration: "PT3H00M",
            flightNumber: `GA${Math.floor(Math.random() * 9000 + 1000)}`,
            stops: 0,
          },
          {
            departure: { airport: "Connecting Hub", iata: "HUB", datetime: `${params.departureDate}T15:30:00` },
            arrival: { airport: "Destination Airport", iata: params.destination, datetime: `${params.departureDate}T18:00:00` },
            duration: "PT2H30M",
            flightNumber: `GA${Math.floor(Math.random() * 9000 + 1000)}`,
            stops: 0,
          },
        ],
        totalPriceUSD: Math.round(basePrice * 0.82),
        pricePerPersonUSD: Math.round(perPerson * 0.82),
        currency: "USD",
        cabin: params.cabinClass ?? "economy",
        baggage: "Checked bag included",
        bookingUrl: "https://example.com/book",
      },
    ];

    return ok({
      searchId: `search_${Date.now()}`,
      params,
      offers,
      cheapestUSD: Math.min(...offers.map((o) => o.totalPriceUSD)),
      fastestDurationMinutes: 390,
      currency: "USD",
      searchedAt: new Date().toISOString(),
      source: "placeholder — connect Amadeus for real results",
    });
  }

  private estimatePrice(params: FlightSearchParams): number {
    // Very rough estimate for UI purposes
    const multiplier =
      params.cabinClass === "business" ? 4 :
      params.cabinClass === "first" ? 7 :
      params.cabinClass === "premium_economy" ? 2 : 1;
    return Math.round(650 * params.adults * multiplier);
  }
}

// ─── TODO: Amadeus provider ───────────────────────────────────────────────────
// Uncomment and implement when AMADEUS_API_KEY is available:
//
// class AmadeusProvider implements FlightProvider {
//   readonly name = "amadeus";
//   private token: string | null = null;
//   private tokenExpiry = 0;
//
//   private async getToken(): Promise<string> {
//     if (this.token && Date.now() < this.tokenExpiry) return this.token;
//     const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: new URLSearchParams({
//         grant_type: "client_credentials",
//         client_id: process.env.AMADEUS_API_KEY!,
//         client_secret: process.env.AMADEUS_API_SECRET!,
//       }),
//     });
//     const data = await res.json();
//     this.token = data.access_token;
//     this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
//     return this.token!;
//   }
//
//   async search(params: FlightSearchParams): Promise<Result<FlightSearchResult>> {
//     const token = await this.getToken();
//     // ... full Amadeus V2 flight offers search implementation
//   }
// }

// ─── Factory ──────────────────────────────────────────────────────────────────

function createFlightProvider(): FlightProvider {
  // When Amadeus is configured: return new AmadeusProvider();
  return new PlaceholderProvider();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function searchFlights(
  params: FlightSearchParams
): Promise<Result<FlightSearchResult>> {
  const provider = createFlightProvider();

  try {
    return await provider.search(params);
  } catch (e) {
    return err<FlightSearchResult>({
      code: "SERVICE_UNAVAILABLE",
      message: `Flight search unavailable: ${(e as Error).message}`,
      service: SERVICE,
      retryable: true,
    });
  }
}
