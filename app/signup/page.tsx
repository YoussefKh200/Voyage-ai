import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up | Voyage AI",
  description:
    "Create a Voyage AI account to save your travel itinerary plans and securely access premium features.",
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#05040b] overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl"
             style={{ background: "radial-gradient(circle, #d4a853, transparent 70%)" }} />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full opacity-5 blur-3xl"
             style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
      </div>

      <div className="flex min-h-screen flex-col">
        {/* Header with home link */}
        <header className="px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#e2714b] flex items-center justify-center text-white text-sm font-bold group-hover:scale-110 transition-transform shadow-md">
              V
            </div>
            <span className="font-display text-lg font-semibold text-white">{APP_NAME}</span>
          </Link>
        </header>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Header section */}
            <div className="mb-12 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-[#d4a853] mb-3 font-semibold">Join Voyage AI</p>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
                Create account
              </h1>
              <p className="text-white/50 text-sm">Start planning smarter, traveling deeper</p>
            </div>

            {/* Form card */}
            <div className="glass rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                   style={{
                     background: "radial-gradient(ellipse at top right, rgba(212, 168, 83, 0.1), transparent 50%)",
                   }} />
              <div className="relative">
                <SignupForm />
              </div>
            </div>

            {/* Footer text */}
            <p className="text-center text-xs text-white/40 mt-8">
              Protected by industry-standard encryption
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
