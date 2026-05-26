"use client";
// components/planner/StepIndicator.tsx — Animated step indicator with progress fill

import { cn } from "@/lib/utils/cn";
import type { PlannerStep } from "@/types";

const STEPS = [
  { number: 1, label: "Destination", icon: "🌍" },
  { number: 2, label: "Budget",      icon: "💰" },
  { number: 3, label: "Interests",   icon: "❤️" },
  { number: 4, label: "Review",      icon: "✨" },
] as const;

interface StepIndicatorProps { currentStep: PlannerStep; }

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-10">
      {/* Step row */}
      <div className="flex items-center justify-between relative">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-5 h-px bg-white/8 mx-7" aria-hidden />
        {/* Animated fill */}
        <div
          className="absolute left-7 top-5 h-px bg-gradient-to-r from-[#d4a853] to-[#e2714b] transition-all duration-700 ease-out"
          style={{ width: `calc(${((currentStep - 1) / 3) * 100}% - 14px)` }}
          aria-hidden
        />

        {STEPS.map((step) => {
          const isActive    = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isPending   = step.number > currentStep;

          return (
            <div key={step.number} className="flex flex-col items-center gap-2 relative z-10">
              {/* Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500",
                  isCompleted && "bg-gradient-to-br from-[#d4a853] to-[#e2714b] text-white shadow-lg shadow-[#d4a853]/30",
                  isActive    && "bg-gradient-to-br from-[#d4a853] to-[#e2714b] text-white shadow-xl shadow-[#d4a853]/40 scale-110",
                  isPending   && "glass border border-white/12 text-white/30"
                )}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: "checkmark 0.4s ease forwards" }} />
                  </svg>
                ) : isActive ? (
                  <span className="text-base">{step.icon}</span>
                ) : (
                  <span className="text-xs">{step.number}</span>
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-xs font-medium hidden sm:block transition-all duration-300",
                isActive    && "text-[#d4a853]",
                isCompleted && "text-white/60",
                isPending   && "text-white/20"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile step text */}
      <p className="text-center text-white/35 text-xs mt-4 sm:hidden">
        Step {currentStep} of 4 — {STEPS[currentStep - 1].label}
      </p>
    </div>
  );
}
