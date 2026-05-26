"use client";
// components/itinerary/map/InteractiveMap.tsx
// ─── Interactive Map Component ────────────────────────────────────────────────
// Renders a Google Maps instance with pins for all itinerary locations.
// Falls back to the rich placeholder if the API key is missing or fails.
// Isolated in its own folder because it will grow (clustering, overlays, etc.)

import { useEffect, useRef, useState, useCallback } from "react";
import { publicConfig } from "@/lib/config/env";
import type { GeneratedDay } from "@/types";
import { CATEGORY_COLORS } from "@/lib/constants";

interface MapPin {
  lat: number;
  lng: number;
  title: string;
  category: string;
  type: "activity" | "meal" | "hotel";
  dayNumber: number;
}

interface InteractiveMapProps {
  days: GeneratedDay[];
  destination: string;
  centerLat?: number;
  centerLng?: number;
  selectedDay?: number | null;
}

// ─── Extract all pins from itinerary days ─────────────────────────────────────

function extractPins(days: GeneratedDay[], selectedDay?: number | null): MapPin[] {
  const filteredDays = selectedDay
    ? days.filter((d) => d.dayNumber === selectedDay)
    : days;

  const pins: MapPin[] = [];

  for (const day of filteredDays) {
    for (const activity of day.activities) {
      if (activity.lat && activity.lng) {
        pins.push({
          lat: activity.lat,
          lng: activity.lng,
          title: activity.name,
          category: activity.category,
          type: "activity",
          dayNumber: day.dayNumber,
        });
      }
    }
    for (const meal of day.meals) {
      if (meal.lat && meal.lng) {
        pins.push({
          lat: meal.lat,
          lng: meal.lng,
          title: meal.name,
          category: "food",
          type: "meal",
          dayNumber: day.dayNumber,
        });
      }
    }
  }

  return pins;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InteractiveMap({
  days,
  destination,
  centerLat,
  centerLng,
  selectedDay,
}: InteractiveMapProps) {
  const hasApiKey = Boolean(publicConfig.googleMapsApiKey);

  if (!hasApiKey) {
    return <MapPlaceholderRich days={days} destination={destination} selectedDay={selectedDay} />;
  }

  return (
    <GoogleMapEmbed
      days={days}
      destination={destination}
      centerLat={centerLat}
      centerLng={centerLng}
      selectedDay={selectedDay}
    />
  );
}

// ─── Google Maps implementation ───────────────────────────────────────────────

function GoogleMapEmbed({
  days,
  destination,
  centerLat,
  centerLng,
  selectedDay,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  const pins = extractPins(days, selectedDay);

  const initMap = useCallback(async () => {
    if (!mapRef.current) return;
    try {
      const { loadGoogleMaps } = await import("@/lib/external/maps/loader");
      await loadGoogleMaps();

      const center = {
        lat: centerLat ?? (pins[0]?.lat ?? 48.8566),
        lng: centerLng ?? (pins[0]?.lng ?? 2.3522),
      };

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        styles: DARK_MAP_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;
      setIsMapLoading(false);
    } catch (err) {
      setMapError("Could not load Google Maps");
      setIsMapLoading(false);
    }
  }, [centerLat, centerLng, pins]);

  // Place markers whenever map or pins change
  const updateMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (pins.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    pins.forEach((pin, i) => {
      const position = { lat: pin.lat, lng: pin.lng };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map,
        title: pin.title,
        label: {
          text: String(pin.dayNumber),
          color: "#ffffff",
          fontWeight: "600",
          fontSize: "11px",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: pin.type === "meal" ? "#e2714b" : "#d4a853",
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family:system-ui;padding:4px 8px;max-width:200px;">
            <p style="font-weight:600;margin:0 0 2px;color:#0f0e17;">${pin.title}</p>
            <p style="color:#555;font-size:12px;margin:0;">Day ${pin.dayNumber} · ${pin.type}</p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    if (pins.length > 1) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else if (pins.length === 1) {
      map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
      map.setZoom(15);
    }
  }, [pins]);

  useEffect(() => { initMap(); }, [initMap]);
  useEffect(() => { updateMarkers(); }, [updateMarkers]);

  if (mapError) {
    return <MapPlaceholderRich days={days} destination={destination} selectedDay={selectedDay} />;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 h-[320px]">
      {isMapLoading && (
        <div className="absolute inset-0 flex items-center justify-center glass z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#d4a853]/30 border-t-[#d4a853] rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Loading map…</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" aria-label={`Map of ${destination}`} />

      {/* Day selector overlay */}
      {days.length > 1 && (
        <div className="absolute top-3 right-3 glass rounded-xl border border-white/15 px-3 py-1.5">
          <p className="text-white/60 text-xs">
            {selectedDay ? `Day ${selectedDay}` : `All ${days.length} days`}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Rich visual placeholder (no API key) ─────────────────────────────────────
// Used when Google Maps is not configured — shows animated pins with location
// names extracted from the actual itinerary data.

function MapPlaceholderRich({
  days,
  destination,
  selectedDay,
}: {
  days: GeneratedDay[];
  destination: string;
  selectedDay?: number | null;
}) {
  const pins = extractPins(days, selectedDay).slice(0, 6);
  // Fixed positions for the placeholder pins
  const positions = [
    { top: "28%", left: "30%" },
    { top: "45%", left: "60%" },
    { top: "35%", left: "72%" },
    { top: "62%", left: "25%" },
    { top: "55%", left: "48%" },
    { top: "25%", left: "52%" },
  ];

  return (
    <div className="map-placeholder rounded-2xl border border-white/10 overflow-hidden relative h-[320px]">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" aria-hidden="true">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Road-like lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden="true">
        <path d="M 60 160 Q 200 80 340 160 T 600 160" stroke="#d4a853" strokeWidth="2" fill="none" />
        <path d="M 0 220 L 600 200" stroke="white" strokeWidth="1" fill="none" />
        <path d="M 300 0 L 280 320" stroke="white" strokeWidth="1" fill="none" />
        <path d="M 120 0 Q 140 160 100 320" stroke="white" strokeWidth="0.5" fill="none" />
        <path d="M 460 0 Q 480 160 450 320" stroke="white" strokeWidth="0.5" fill="none" />
      </svg>

      {/* Animated pins */}
      {pins.map((pin, i) => {
        const pos = positions[i] ?? { top: "50%", left: "50%" };
        return (
          <div
            key={`${pin.title}-${i}`}
            className="absolute flex flex-col items-center gap-1 animate-float"
            style={{
              top: pos.top,
              left: pos.left,
              animationDelay: `${i * 0.7}s`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="w-3 h-3 rounded-full bg-[#d4a853] shadow-lg shadow-[#d4a853]/50 ring-2 ring-white/20" />
            <div className="px-2 py-0.5 rounded text-[10px] bg-[#0f0e17]/90 text-white/70 border border-white/10 whitespace-nowrap max-w-[120px] truncate">
              {pin.title}
            </div>
          </div>
        );
      })}

      {/* Centre content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center glass rounded-2xl border border-[#d4a853]/20 px-8 py-6 max-w-xs">
          <div className="text-3xl mb-3" aria-hidden="true">🗺️</div>
          <h4 className="text-white font-semibold text-sm mb-1.5">
            {destination} Map
          </h4>
          <p className="text-white/40 text-xs mb-3 leading-relaxed">
            Add <code className="text-[#d4a853]/80 text-[10px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable interactive maps
          </p>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(destination)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-4 py-2 rounded-lg glass border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all inline-flex items-center gap-1.5"
          >
            Open in Google Maps ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Dark map style ───────────────────────────────────────────────────────────
// Custom styled map that matches the app's dark theme.

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f0e17" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a5e" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e1e2e" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#162420" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
];