"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils/cn";

export function UserMenu() {
  const { session, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Show login/signup buttons by default (don't wait for loading)
  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-gradient-to-r from-[#d4a853] to-[#e2714b] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#d4a853]/20 transition hover:brightness-110"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4a853] to-[#e2714b] flex items-center justify-center text-xs font-bold">
          {session.email[0].toUpperCase()}
        </div>
        <span className="hidden sm:inline">{session.email}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={cn("transition-transform", menuOpen && "rotate-180")}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl glass border border-white/10 shadow-2xl z-50">
          <div className="p-3 border-b border-white/5">
            <p className="text-xs text-white/50">Logged in as</p>
            <p className="text-sm font-medium text-white truncate">{session.email}</p>
          </div>
          <nav className="flex flex-col gap-1 p-2">
            <Link
              href="/planner"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              Plan trip
            </Link>
            <Link
              href="/welcome"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              Get started
            </Link>
            <Link
              href="/plans"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              View plans
            </Link>
          </nav>
          <button
            onClick={() => {
              logout();
              setMenuOpen(false);
            }}
            className="w-full px-3 py-2 m-2 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-500/10 transition border-t border-white/5"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
