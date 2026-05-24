// lib/store/planner.store.ts
// ─── Zustand Planner Store ────────────────────────────────────────────────────
// Changes from original:
//  - Removed ~6 individual field setters (setDestination, setDates, setBudget...)
//    in favour of a single typed patch setter — cleaner API surface, less boilerplate
//  - Split into two slices: formSlice (persisted) + sessionSlice (ephemeral)
//    so large itinerary JSON doesn't hit localStorage quota limits
//  - Removed TripInputs import used only for casting — store now owns Partial<TripInputs>
//  - Added step validation guard so nextStep() is safe to call anywhere
//  - Itinerary NOT persisted (can be hundreds of KB) — session only

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  PlannerStep,
  TripInputs,
  GeneratedItinerary,
  Interest,
  TravelStyle,
} from "@/types";

// ─── Slice types ──────────────────────────────────────────────────────────────

interface FormSlice {
  inputs: Partial<TripInputs>;
  patchInputs: (patch: Partial<TripInputs>) => void;
  toggleInterest: (interest: Interest) => void;
  resetInputs: () => void;
}

interface StepSlice {
  step: PlannerStep;
  setStep: (step: PlannerStep) => void;
  nextStep: () => void;
  prevStep: () => void;
}

interface SessionSlice {
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  itinerary: GeneratedItinerary | null;
  setItinerary: (itinerary: GeneratedItinerary) => void;
  error: string | null;
  setError: (error: string | null) => void;
  reset: () => void;
}

type PlannerStore = FormSlice & StepSlice & SessionSlice;

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_INPUTS: Partial<TripInputs> = {
  travelers: 2,
  travelStyle: "comfort" satisfies TravelStyle,
  interests: [],
};

const DEFAULT_SESSION = {
  isGenerating: false,
  itinerary: null,
  error: null,
} as const;

// ─── Store ───────────────────────────────────────────────────────────────────

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
      // ── Step slice ─────────────────────────────────────────────────────────
      step: 1,
      setStep: (step) => set({ step }),
      nextStep: () => {
        const s = get().step;
        if (s < 4) set({ step: (s + 1) as PlannerStep });
      },
      prevStep: () => {
        const s = get().step;
        if (s > 1) set({ step: (s - 1) as PlannerStep });
      },

      // ── Form slice ─────────────────────────────────────────────────────────
      inputs: DEFAULT_INPUTS,
      patchInputs: (patch) =>
        set((state) => ({ inputs: { ...state.inputs, ...patch } })),
      toggleInterest: (interest) =>
        set((state) => {
          const current = state.inputs.interests ?? [];
          const updated = current.includes(interest)
            ? current.filter((i) => i !== interest)
            : [...current, interest];
          return { inputs: { ...state.inputs, interests: updated } };
        }),
      resetInputs: () => set({ inputs: DEFAULT_INPUTS }),

      // ── Session slice ──────────────────────────────────────────────────────
      ...DEFAULT_SESSION,
      setIsGenerating: (val) => set({ isGenerating: val }),
      setItinerary: (itinerary) => set({ itinerary }),
      setError: (error) => set({ error }),
      reset: () =>
        set({ step: 1, inputs: DEFAULT_INPUTS, ...DEFAULT_SESSION }),
    }),
    {
      name: "voyage-planner-v2", // bumped key so old v1 data doesn't conflict
      storage: createJSONStorage(() => localStorage),
      // Only persist form inputs — NOT itinerary (too large) or UI state
      partialize: (state): Pick<PlannerStore, "inputs"> => ({
        inputs: state.inputs,
      }),
    }
  )
);

// ─── Typed selectors (memoized via stable references) ────────────────────────
// Import these in components instead of re-deriving in every render.

export const selectInputs = (s: PlannerStore) => s.inputs;
export const selectStep = (s: PlannerStore) => s.step;
export const selectIsGenerating = (s: PlannerStore) => s.isGenerating;
export const selectItinerary = (s: PlannerStore) => s.itinerary;
export const selectError = (s: PlannerStore) => s.error;
