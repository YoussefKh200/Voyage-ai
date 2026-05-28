"use client";
// components/landing/Hero.tsx — Premium animated hero with staggered reveals

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DESTINATIONS = ["Paris", "Tokyo", "Marrakech", "Lisbon", "Bali", "New York", "Cape Town", "Rome"];
const ROTATING_WORDS = ["journey", "adventure", "escape", "story"];

export function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [wordVisible, setWordVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setWordVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Layered background orbs */}
      <div
        className="orb w-[700px] h-[700px] -top-48 -left-48 opacity-[0.13]"
        style={{ background: "radial-gradient(circle, #d4a853, transparent 65%)" }}
      />
      <div
        className="orb w-[600px] h-[600px] top-1/3 -right-48 opacity-[0.10]"
        style={{ background: "radial-gradient(circle, #e2714b, transparent 65%)", animationDelay: "2s" }}
      />
      <div
        className="orb w-[500px] h-[500px] bottom-0 left-1/3 opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent 65%)", animationDelay: "4s" }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Live badge */}
        <div
          className="inline-flex items-center gap-2.5 glass px-4 py-2 rounded-full text-xs font-medium text-[#d4a853] border border-[#d4a853]/20 mb-10 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)" }}
        >
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4a853] opacity-50" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-[#d4a853]" />
          </span>
          AI-powered itinerary generation — free to try
        </div>

        {/* Headline with staggered words */}
        <h1
          className="font-display text-6xl md:text-8xl font-bold text-white leading-[0.92] tracking-tight mb-8 transition-all duration-700 delay-100"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          Your perfect
          <br />
          <span
            className="gradient-text italic inline-block transition-all duration-300"
            style={{
              opacity: wordVisible ? 1 : 0,
              transform: wordVisible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
            }}
          >
            {ROTATING_WORDS[wordIndex]}
          </span>
          <br />
          awaits.
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-6 leading-relaxed font-light transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "200ms",
          }}
        >
          Tell us where you want to go and what you love — Voyage AI crafts a complete,
          personalised day-by-day itinerary in seconds.
        </p>

        {/* Destination pills */}
        <div
          className="flex items-center justify-center gap-2 mb-12 flex-wrap transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transitionDelay: "300ms",
          }}
        >
          <span className="text-white/25 text-sm mr-1">Trending:</span>
          {DESTINATIONS.map((dest, i) => (
            <Link
              key={dest}
              href={`/planner?destination=${encodeURIComponent(dest)}`}
              className="text-sm px-3.5 py-1.5 rounded-full glass border border-white/8 text-white/45
                         hover:text-[#d4a853] hover:border-[#d4a853]/35 hover:bg-[#d4a853]/5
                         transition-all duration-200 hover:-translate-y-0.5"
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              {dest}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "400ms",
          }}
        >
          <Link
            href="/planner"
            className="btn-primary px-9 py-4 rounded-2xl text-base font-semibold inline-flex items-center gap-3 w-full sm:w-auto justify-center shadow-lg"
          >
            <span>Start planning free</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-200 group-hover:translate-x-1">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="/#how-it-works"
            className="px-9 py-4 rounded-2xl text-base font-medium text-white/55 hover:text-white
                       glass border border-white/10 hover:border-white/20 transition-all duration-200
                       w-full sm:w-auto text-center"
          >
            See how it works
          </Link>
        </div>

        {/* Social proof strip */}
        <div
          className="flex items-center justify-center gap-8 flex-wrap transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transitionDelay: "500ms",
          }}
        >
          {[
            { value: "50K+", label: "trips planned" },
            { value: "120+", label: "destinations" },
            { value: "4.9★", label: "avg rating" },
            { value: "<30s", label: "to generate" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-display font-bold text-white/80">{stat.value}</span>
              <span className="text-white/30 text-xs">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <span className="text-[10px] tracking-[0.2em] uppercase text-white">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  );
}
