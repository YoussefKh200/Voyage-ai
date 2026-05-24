// components/ui/Badge.tsx
// ─── Reusable Badge/Tag component ────────────────────────────────────────────

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "gold" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-white/70 border-white/15",
  gold: "bg-[#d4a853]/15 text-[#d4a853] border-[#d4a853]/25",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  danger: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

export function Badge({
  children,
  variant = "default",
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "gold" ? "bg-[#d4a853]" :
            variant === "success" ? "bg-emerald-400" :
            variant === "warning" ? "bg-amber-400" :
            variant === "danger" ? "bg-rose-400" :
            variant === "info" ? "bg-blue-400" : "bg-white/50"
          )}
        />
      )}
      {children}
    </span>
  );
}
