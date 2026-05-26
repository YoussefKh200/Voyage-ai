import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Welcome | Voyage AI",
  description: "Welcome to Voyage AI. Start planning your next adventure.",
};

export default async function WelcomePage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const userFirstName = session.email.split("@")[0];

  return (
    <main className="min-h-screen bg-[#05040b] overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: "radial-gradient(circle, #d4a853, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
      </div>

      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="px-6 py-5 border-b border-white/8">
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#e2714b] flex items-center justify-center text-white text-sm font-bold">
              V
            </div>
            <span className="font-display text-lg font-semibold text-white">{APP_NAME}</span>
          </Link>
        </header>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-2xl text-center">
            {/* Greeting */}
            <div className="mb-8 space-y-4">
              <div className="inline-block">
                <p className="text-6xl">👋</p>
              </div>
              <h1 className="text-5xl sm:text-6xl font-display font-bold text-white">
                Welcome, {userFirstName}!
              </h1>
              <p className="text-lg text-white/60 max-w-lg mx-auto">
                You're all set. Let's plan your next adventure with {APP_NAME}.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid sm:grid-cols-3 gap-4 my-12">
              <div className="glass rounded-2xl border border-white/10 p-6">
                <div className="text-3xl mb-3">🗺️</div>
                <p className="font-medium text-white">Instant Plans</p>
                <p className="text-xs text-white/50 mt-2">AI-generated itineraries in seconds</p>
              </div>
              <div className="glass rounded-2xl border border-white/10 p-6">
                <div className="text-3xl mb-3">💰</div>
                <p className="font-medium text-white">Budget Control</p>
                <p className="text-xs text-white/50 mt-2">Optimize spending smartly</p>
              </div>
              <div className="glass rounded-2xl border border-white/10 p-6">
                <div className="text-3xl mb-3">⚡</div>
                <p className="font-medium text-white">Smart Routing</p>
                <p className="text-xs text-white/50 mt-2">No wasted time backtracking</p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/planner"
                className="rounded-2xl bg-gradient-to-r from-[#d4a853] to-[#e2714b] px-8 py-4 font-bold uppercase tracking-wide text-white shadow-xl shadow-[#d4a853]/25 transition-all hover:brightness-110 inline-flex items-center justify-center gap-2"
              >
                <span>Start Planning</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link
                href="/"
                className="rounded-2xl border-2 border-white/15 px-8 py-4 font-bold uppercase tracking-wide text-white transition-all hover:bg-white/5 inline-flex items-center justify-center gap-2"
              >
                <span>Learn More</span>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/40 text-xs">
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 1L8.12 3.27 11 3.64 9 5.59l.47 2.75L6 7.06 3.53 8.34 4 5.59 2 3.64l2.88-.37L6 1z"/>
                </svg>
                Trusted by thousands
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 1c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm1 7H5V5h2v3z"/>
                </svg>
                30-second setup
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 1C3.24 1 1 3.24 1 6s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 9c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                </svg>
                AI-powered
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/8 px-6 py-6 text-center text-xs text-white/40">
          <p>Ready to explore? Start planning your next adventure now.</p>
        </footer>
      </div>
    </main>
  );
}
