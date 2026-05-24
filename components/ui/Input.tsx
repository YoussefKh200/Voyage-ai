// components/ui/Input.tsx
// ─── Reusable Input component ─────────────────────────────────────────────────

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-white/70"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftAddon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              "input-glass w-full py-3.5 rounded-xl text-sm",
              leftAddon ? "pl-11" : "pl-4",
              rightAddon ? "pr-11" : "pr-4",
              error && "border-rose-500/50 focus:border-rose-500/70",
              className
            )}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
              {rightAddon}
            </div>
          )}
        </div>

        {error && <p className="text-rose-400 text-xs">{error}</p>}
        {hint && !error && <p className="text-white/35 text-xs">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
