// components/ui/ProgressBar.tsx

import { cn } from "@/lib/utils";

type ProgressColor = "gold" | "green" | "red" | "blue";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  label?: string;
  sublabel?: string;
  color?: ProgressColor;
  className?: string;
  "aria-label"?: string;
}

const colorClasses: Record<ProgressColor, string> = {
  gold: "from-[#d4a853] to-[#e2714b]",
  green: "from-emerald-500 to-teal-500",
  red: "from-rose-500 to-pink-500",
  blue: "from-blue-500 to-indigo-500",
};

export function ProgressBar({
  value,
  label,
  sublabel,
  color = "gold",
  className,
  "aria-label": ariaLabel,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("space-y-2", className)}>
      {(label || sublabel) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-white/70">{label}</span>}
          {sublabel && <span className="text-white/40">{sublabel}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? label}
        className="h-1.5 bg-white/8 rounded-full overflow-hidden"
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            colorClasses[color]
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
