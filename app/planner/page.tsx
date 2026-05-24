"use client";
// app/planner/page.tsx — Polished onboarding flow with animated transitions

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { usePlannerStore, selectStep } from "@/lib/store/planner.store";
import { usePlannerNavigation } from "@/lib/hooks/usePlannerNavigation";
import { StepIndicator } from "@/components/planner/StepIndicator";
import { Step1Destination } from "@/components/planner/Step1Destination";
import { Step2Budget } from "@/components/planner/Step2Budget";
import { Step3Interests } from "@/components/planner/Step3Interests";
import { Step4Review } from "@/components/planner/Step4Review";
import { cn } from "@/lib/utils/cn";
import { APP_NAME } from "@/lib/constants";

const STEP_COMPONENTS = {
  1: Step1Destination,
  2: Step2Budget,
  3: Step3Interests,
  4: Step4Review,
} as const;

function PlannerContent() {
  const searchParams = useSearchParams();
  const step = usePlannerStore(selectStep);
  const patchInputs = usePlannerStore((s) => s.patchInputs);
  const { nextStep, prevStep, canProceed } = usePlannerNavigation();

  // Pre-fill destination from URL query param
  useEffect(() => {
    const dest = searchParams.get("destination");
    if (dest) patchInputs({ destination: dest });
  }, [searchParams, patchInputs]);

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.10]"
             style={{ background: "radial-gradient(circle, #d4a853, transparent 70%)", filter: "blur(70px)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.07]"
             style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)", filter: "blur(70px)" }} />
      </div>

      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4 glass sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#e2714b] flex items-center justify-center text-white text-sm font-bold group-hover:scale-105 transition-transform shadow-md">
              V
            </div>
            <span className="font-display text-lg font-semibold text-white">{APP_NAME}</span>
          </Link>
          <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Back
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center py-8 px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          <StepIndicator currentStep={step} />

          {/* Card */}
          <div className="glass rounded-3xl border border-white/10 p-6 sm:p-10 relative overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none rounded-3xl" />

            <div className="relative">
              <StepComponent />

              {/* Navigation */}
              {step < 4 && (
                <div className="flex items-center justify-between mt-10 pt-7 border-t border-white/8">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={step === 1}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      step === 1
                        ? "text-white/15 cursor-not-allowed"
                        : "glass border border-white/10 text-white/55 hover:text-white hover:border-white/22"
                    )}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    Back
                  </button>

                  <div className="flex items-center gap-3">
                    {/* Progress text */}
                    <span className="text-white/25 text-xs">{step} / 4</span>

                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceed}
                      className={cn(
                        "px-7 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300",
                        canProceed
                          ? "btn-primary shadow-lg"
                          : "glass border border-white/8 text-white/20 cursor-not-allowed"
                      )}
                    >
                      Continue
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M4.5 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 mt-6 text-white/20 text-xs">
            <span className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1L6.12 3.27 9 3.64 7 5.59l.47 2.75L5 7.06 2.53 8.34 3 5.59 1 3.64l2.88-.37L5 1z" fill="currentColor"/>
              </svg>
              Free to use
            </span>
            <span>·</span>
            <span>No account needed</span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="2" y="4" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1"/>
                <path d="M3.5 4V3a1.5 1.5 0 013 0v1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              Privacy first
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#d4a853]/30 border-t-[#d4a853] animate-spin" />
      </div>
    }>
      <PlannerContent />
    </Suspense>
  );
}
