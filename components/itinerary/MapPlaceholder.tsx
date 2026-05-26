"use client";
// components/itinerary/MapPlaceholder.tsx

export function MapPlaceholder() {
  return (
    <div className="map-placeholder rounded-2xl border border-white/10 overflow-hidden relative h-[300px] flex items-center justify-center">
      {/* Grid overlay for map feel */}
      <div className="absolute inset-0">
        {/* Fake map pins */}
        {[
          { top: "30%", left: "35%", label: "Museum" },
          { top: "55%", left: "60%", label: "Restaurant" },
          { top: "40%", left: "70%", label: "Viewpoint" },
          { top: "65%", left: "28%", label: "Market" },
        ].map((pin, i) => (
          <div
            key={i}
            className="absolute flex flex-col items-center gap-1 animate-float"
            style={{
              top: pin.top,
              left: pin.left,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#e2714b] shadow-lg shadow-[#e2714b]/50" />
            <div className="px-2 py-0.5 rounded text-[10px] bg-[#0f0e17]/90 text-white/60 border border-white/10 whitespace-nowrap">
              {pin.label}
            </div>
          </div>
        ))}

        {/* Fake road lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300">
          <path d="M 50 150 Q 150 80 250 150 T 400 150" stroke="#d4a853" strokeWidth="2" fill="none" />
          <path d="M 0 200 L 400 180" stroke="white" strokeWidth="1" fill="none" />
          <path d="M 200 0 L 180 300" stroke="white" strokeWidth="1" fill="none" />
          <path d="M 100 0 Q 120 150 80 300" stroke="white" strokeWidth="0.5" fill="none" />
        </svg>
      </div>

      {/* Overlay content */}
      <div className="relative z-10 text-center">
        <div className="w-14 h-14 rounded-2xl glass border border-[#d4a853]/30 flex items-center justify-center text-2xl mx-auto mb-4">
          🗺️
        </div>
        <h4 className="text-white font-semibold text-base mb-2">Interactive Map</h4>
        <p className="text-white/40 text-sm max-w-xs">
          All your locations pinned and ready. Connect your Google Maps API key to enable.
        </p>
        <button className="mt-4 px-5 py-2.5 rounded-xl glass border border-white/15 text-white/60 text-sm hover:text-white hover:border-white/30 transition-all">
          View in Google Maps →
        </button>
      </div>
    </div>
  );
}
