// app/page.tsx — Landing page with animated CTA banner
import { Navbar }      from "@/components/landing/Navbar";
import { Hero }        from "@/components/landing/Hero";
import { Features }    from "@/components/landing/Features";
import { HowItWorks }  from "@/components/landing/HowItWorks";
import { Footer }      from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />

      {/* CTA banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-14 border border-[#d4a853]/18 relative overflow-hidden text-center">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 opacity-[0.03]" style={{ background: "radial-gradient(circle at 50% 0%, #d4a853, transparent 70%)" }} />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-px bg-gradient-to-r from-transparent via-[#d4a853]/50 to-transparent" />
            </div>
            <div className="relative z-10">
              <h2 className="font-display text-5xl md:text-6xl font-bold text-white mb-5">
                Your next adventure
                <br /><span className="gradient-text italic">starts here.</span>
              </h2>
              <p className="text-white/40 text-lg mb-9 max-w-xl mx-auto">
                Join thousands of travellers who&apos;ve discovered smarter, deeper journeys.
              </p>
              <a href="/planner" className="btn-primary px-10 py-4 rounded-2xl text-base font-semibold inline-flex items-center gap-3 shadow-2xl shadow-[#d4a853]/20">
                Plan my trip now
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <p className="text-white/20 text-xs mt-4">Free to use · No account needed · 30-second setup</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
