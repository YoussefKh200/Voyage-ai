"use client";
// components/landing/HowItWorks.tsx — Animated timeline with scroll reveals

import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    number: "01",
    icon: "🌍",
    title: "Tell us where you're headed",
    description: "Enter your destination, travel dates, and how many people are joining the adventure. Any city, country, or region in the world.",
    detail: "Paris, Bali, Tokyo, Cape Town — we know them all.",
    color: "from-[#d4a853]/20",
    dot: "#d4a853",
  },
  {
    number: "02",
    icon: "🎯",
    title: "Share your style & budget",
    description: "Budget explorer or luxury traveller? Tell us your total budget and travel style — we'll tune every single recommendation around it.",
    detail: "From $50/day backpacker to $500/day luxury.",
    color: "from-violet-500/20",
    dot: "#a78bfa",
  },
  {
    number: "03",
    icon: "❤️",
    title: "Choose your passions",
    description: "Museums, street food, nightlife, hiking — select what genuinely excites you. Your entire itinerary is built around it.",
    detail: "Mix and match up to 7 interest categories.",
    color: "from-rose-500/20",
    dot: "#f43f5e",
  },
  {
    number: "04",
    icon: "✨",
    title: "Get your perfect itinerary",
    description: "In under 30 seconds, receive a complete day-by-day plan: activities, restaurants, transport, timings, and cost estimates.",
    detail: "Real venues. Real addresses. Real costs.",
    color: "from-emerald-500/20",
    dot: "#10b981",
  },
];

export function HowItWorks() {
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>(new Array(STEPS.length).fill(false));
  const [lineProgress, setLineProgress] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Stagger-reveal steps on intersection
    const observers = refs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleSteps((v) => { const n = [...v]; n[i] = true; return n; });
              setLineProgress((i + 1) / STEPS.length);
            }, i * 150);
            obs.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <section id="how-it-works" className="py-28 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,168,83,0.04), transparent 70%)", filter: "blur(60px)" }}
      />

      <div className="max-w-4xl mx-auto relative z-10" ref={sectionRef}>
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#d4a853] text-xs font-semibold tracking-[0.2em] uppercase mb-4">The process</p>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-5">
            Four steps to your{" "}
            <span className="gradient-text italic">dream trip.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            From idea to full itinerary in the time it takes to make a coffee.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Animated vertical line */}
          <div className="absolute left-6 top-8 bottom-8 w-px bg-white/6 hidden md:block" />
          <div
            className="absolute left-6 top-8 w-px bg-gradient-to-b from-[#d4a853] via-[#e2714b] to-violet-500 hidden md:block transition-all duration-1000 ease-out"
            style={{ height: `calc(${lineProgress * 100}% - 64px)` }}
          />

          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <div
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                className="flex gap-6 md:gap-8"
                style={{
                  opacity: visibleSteps[i] ? 1 : 0,
                  transform: visibleSteps[i] ? "translateX(0)" : "translateX(-20px)",
                  transition: "opacity 600ms ease, transform 600ms cubic-bezier(0.34,1.2,0.64,1)",
                }}
              >
                {/* Timeline dot */}
                <div className="hidden md:flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold z-10 transition-all duration-500"
                    style={{
                      borderColor: visibleSteps[i] ? step.dot : "rgba(255,255,255,0.12)",
                      background: visibleSteps[i] ? `${step.dot}18` : "rgba(255,255,255,0.03)",
                      color: visibleSteps[i] ? step.dot : "rgba(255,255,255,0.2)",
                      boxShadow: visibleSteps[i] ? `0 0 20px ${step.dot}30` : "none",
                    }}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Content card */}
                <div className={`flex-1 glass card-hover rounded-2xl p-7 border border-white/8 relative overflow-hidden group`}>
                  {/* Hover gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none`} />

                  <div className="relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0 mt-0.5">
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Mobile step number */}
                        <p className="text-white/25 text-xs font-semibold mb-1 md:hidden">{step.number}</p>
                        <h3 className="font-display text-xl font-semibold text-white mb-2 group-hover:text-[#d4a853] transition-colors duration-200">
                          {step.title}
                        </h3>
                        <p className="text-white/50 text-[15px] leading-relaxed">{step.description}</p>
                        <p className="text-white/25 text-xs mt-3 italic">{step.detail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <a
            href="/planner"
            className="btn-primary px-10 py-4 rounded-2xl text-base font-semibold inline-flex items-center gap-3 shadow-xl shadow-[#d4a853]/20"
          >
            <span>Start planning — it&apos;s free</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <p className="text-white/20 text-xs mt-3">No account required · Takes 60 seconds</p>
        </div>
      </div>
    </section>
  );
}
