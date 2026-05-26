"use client";
// components/landing/Features.tsx — Animated feature cards with entrance reveals

import { useEffect, useRef, useState } from "react";

const FEATURES = [
  { icon: "🧠", title: "Genuinely intelligent", description: "Not templates — real AI. It understands your travel style, budget, and passions to craft plans that make sense.", accent: "from-violet-500/20 to-transparent", border: "border-violet-500/15", glow: "rgba(124,58,237,0.15)" },
  { icon: "📍", title: "Day-by-day precision", description: "Every hour planned. Activities clustered geographically, realistic timing, natural rhythm between intense and relaxed days.", accent: "from-amber-500/20 to-transparent", border: "border-amber-500/15", glow: "rgba(245,158,11,0.15)" },
  { icon: "🍽️", title: "Local dining picks", description: "From hidden breakfast spots to unmissable dinner experiences — matched to your cuisine taste and budget.", accent: "from-rose-500/20 to-transparent", border: "border-rose-500/15", glow: "rgba(244,63,94,0.15)" },
  { icon: "💰", title: "Real budget tracking", description: "Cost estimates for every activity, meal, and transport leg. See your daily spend at a glance.", accent: "from-emerald-500/20 to-transparent", border: "border-emerald-500/15", glow: "rgba(16,185,129,0.15)" },
  { icon: "🗺️", title: "Map-ready routes", description: "Every location geocoded and pinned. Export to Google Maps, share with companions, navigate directly.", accent: "from-blue-500/20 to-transparent", border: "border-blue-500/15", glow: "rgba(59,130,246,0.15)" },
  { icon: "✏️", title: "Fully customisable", description: "The AI gives you a brilliant starting point. You refine it. Add, remove, swap — it's yours to perfect.", accent: "from-pink-500/20 to-transparent", border: "border-pink-500/15", glow: "rgba(236,72,153,0.15)" },
];

export function Features() {
  const [visible, setVisible] = useState<boolean[]>(new Array(FEATURES.length).fill(false));
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = refs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible((v) => { const n = [...v]; n[i] = true; return n; }), i * 80);
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <section id="features" className="py-28 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-18">
          <p className="text-[#d4a853] text-xs font-semibold tracking-[0.2em] uppercase mb-4">Why Voyage AI</p>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-5">
            Planning that actually <span className="gradient-text italic">thinks.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-2xl mx-auto leading-relaxed">
            Every feature built to take you from "I want to go somewhere" to a complete, executable plan in under 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              className={`group glass card-hover rounded-2xl p-7 border ${f.border} relative overflow-hidden cursor-default`}
              style={{
                opacity: visible[i] ? 1 : 0,
                transform: visible[i] ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
                transition: "opacity 500ms ease, transform 500ms cubic-bezier(0.34,1.3,0.64,1)",
              }}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} pointer-events-none transition-opacity duration-400`} />

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${f.glow}, transparent 70%)` }}
              />

              <div className="relative z-10">
                <div className="text-4xl mb-5 group-hover:scale-110 transition-transform duration-300 inline-block">{f.icon}</div>
                <h3 className="font-display text-xl font-semibold text-white mb-3 group-hover:text-[#d4a853] transition-colors duration-300">{f.title}</h3>
                <p className="text-white/50 leading-relaxed text-[15px]">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
