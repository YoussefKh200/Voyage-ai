"use client";
// components/landing/Navbar.tsx — Polished navbar with scroll blur and mobile drawer

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { APP_NAME } from "@/lib/constants";
import { UserMenu } from "@/components/landing/UserMenu";

const NAV_LINKS = [
  { href: "/#features",      label: "Features"     },
  { href: "/#how-it-works",  label: "How it works" },
  { href: "/#plans",         label: "Plans"         },
];

export function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrollPct,  setScrollPct]  = useState(0);

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 24);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "glass border-b border-white/8 py-3" : "py-5 bg-transparent"
        )}
      >
        {/* Reading progress bar */}
        <div
          className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-[#d4a853] to-[#e2714b] transition-all duration-100"
          style={{ width: `${scrollPct}%` }}
          aria-hidden
        />

        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Voyage AI home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#e2714b] flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:scale-110 group-hover:shadow-[#d4a853]/40 transition-all duration-300">
              V
            </div>
            <span className="font-display text-xl font-semibold text-white tracking-tight">{APP_NAME}</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-white/50 hover:text-white transition-colors duration-200 relative group"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-[#d4a853] to-[#e2714b] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <UserMenu />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg glass border border-white/10 flex flex-col gap-1.5 w-9 h-9 items-center justify-center"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={cn("w-4 h-px bg-white/70 transition-all duration-300 origin-center", menuOpen && "rotate-45 translate-y-[5px]")} />
            <span className={cn("w-4 h-px bg-white/70 transition-all duration-200", menuOpen && "opacity-0 scale-x-0")} />
            <span className={cn("w-4 h-px bg-white/70 transition-all duration-300 origin-center", menuOpen && "-rotate-45 -translate-y-[5px]")} />
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-400",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-72 glass border-l border-white/10 p-8 flex flex-col",
            "transition-transform duration-400 ease-out",
            menuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between mb-10">
            <span className="font-display text-lg font-semibold text-white">{APP_NAME}</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {NAV_LINKS.map(({ href, label }, i) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm font-medium animate-slide-right opacity-0"
                style={{ animationDelay: `${i * 60 + 100}ms`, animationFillMode: "forwards" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="rounded-3xl border border-white/10 px-5 py-3 text-sm font-medium text-white/80 text-center hover:bg-white/5"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="rounded-3xl bg-gradient-to-r from-[#d4a853] to-[#e2714b] px-5 py-3 text-sm font-semibold text-white text-center shadow-md shadow-[#d4a853]/20 hover:brightness-110"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
