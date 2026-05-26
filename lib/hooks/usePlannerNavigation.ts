// lib/hooks/usePlannerNavigation.ts
// ─── Planner Navigation Hook ──────────────────────────────────────────────────
// Changes from original:
//  - Validation now delegates to Zod step schemas (single source of truth)
//  - No more duplicated field checks that could drift from the API schema
//  - useMemo ensures results are stable across renders (not re-derived on every keypress)
//  - Returns validation errors per step so UI can surface them

import { useMemo } from "react";
import { usePlannerStore, selectInputs, selectStep } from "@/lib/store/planner.store";
import { Step1Schema, Step2Schema, Step3Schema } from "@/lib/schemas/trip.schema";
import type { PlannerStep } from "@/types";

interface StepValidity {
  valid: boolean;
  errors: string[];
}

function validateStep(step: PlannerStep, inputs: ReturnType<typeof selectInputs>): StepValidity {
  const schemas: Record<PlannerStep, { safeParse: (d: unknown) => { success: boolean; error?: { issues: { message: string }[] } } }> = {
    1: Step1Schema,
    2: Step2Schema,
    3: Step3Schema,
    4: Step1Schema, // Step 4 is review — all previous must pass
  };

  if (step === 4) {
    // All three steps must be valid
    const results = [Step1Schema, Step2Schema, Step3Schema].map((s) => s.safeParse(inputs));
    const errors = results.flatMap((r) => (r.success ? [] : r.error?.issues.map((i) => i.message) ?? []));
    return { valid: errors.length === 0, errors };
  }

  const result = schemas[step].safeParse(inputs);
  return {
    valid: result.success,
    errors: result.success ? [] : result.error?.issues.map((i) => i.message) ?? [],
  };
}

export function usePlannerNavigation() {
  const inputs = usePlannerStore(selectInputs);
  const step = usePlannerStore(selectStep);
  const { nextStep, prevStep } = usePlannerStore();

  const validity = useMemo(() => validateStep(step, inputs), [step, inputs]);
  const isReadyToGenerate = useMemo(
    () => validateStep(4, inputs).valid,
    [inputs]
  );

  return {
    step,
    nextStep,
    prevStep,
    canProceed: validity.valid,
    stepErrors: validity.errors,
    isReadyToGenerate,
  };
}
