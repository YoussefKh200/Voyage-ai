// components/shared/AppHeader.tsx
// ─── Shared in-app header ─────────────────────────────────────────────────────
// The planner and itinerary pages had nearly identical header markup.
// Extracted here with a slot for right-side actions.

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

interface AppHeaderProps {
  /** Content rendered on the right side of the header */
  rightSlot?: React.ReactNode;
  sticky?: boolean;
}

export function AppHeader({ rightSlot, sticky = false }: AppHeaderProps) {
  return (
    <header
      className={`border-b border-white/8 px-6 py-4 z-30 glass flex-shrink-0 ${
        sticky ? "sticky top-0" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#e2714b] flex items-center justify-center text-white text-sm font-bold group-hover:scale-105 transition-transform shadow-lg">
            V
          </div>
          <span className="font-display text-xl font-semibold text-white">
            {APP_NAME}
          </span>
        </Link>

        {rightSlot && (
          <div className="flex items-center gap-3">{rightSlot}</div>
        )}
      </div>
    </header>
  );
}
