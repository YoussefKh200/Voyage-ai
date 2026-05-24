// components/ui/Spinner.tsx
// ─── Loading Spinner ──────────────────────────────────────────────────────────

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
const borderClasses = { sm: "border-2", md: "border-2", lg: "border-[3px]" };

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={cn(
        "rounded-full border-[#d4a853]/25 border-t-[#d4a853] animate-spin",
        sizeClasses[size],
        borderClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

// Full-page loading overlay
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-[#0f0e17]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6">
      <Spinner size="lg" />
      <p className="text-white/50 text-sm">{message}</p>
    </div>
  );
}
