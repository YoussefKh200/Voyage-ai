// components/shared/Accessibility.tsx
// ─── Accessibility Components ─────────────────────────────────────────────────
// WCAG 2.1 AA compliance helpers used across the app.

"use client";

import { useEffect, useRef } from "react";

// ─── Skip-to-content link ─────────────────────────────────────────────────────
// Appears on Tab press for keyboard users — lets them skip the navbar.
// Must be the FIRST focusable element on every page.

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-[9999]
        px-5 py-3 rounded-xl
        bg-[#d4a853] text-white font-semibold text-sm
        focus:outline-none focus:ring-2 focus:ring-white
        transition-all duration-150
      "
    >
      Skip to main content
    </a>
  );
}

// ─── Live region for screen reader announcements ──────────────────────────────
// Announce dynamic changes (itinerary generated, error occurred, etc.)

export function LiveRegion({ message }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// ─── Focus trap hook ──────────────────────────────────────────────────────────
// Traps keyboard focus inside a modal/dialog.

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    // Focus first element on mount
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return containerRef;
}

// ─── Visually hidden (screen-reader only) ────────────────────────────────────

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// ─── Loading announcement hook ────────────────────────────────────────────────
// Announces to screen readers when async operations start/finish.

export function useLoadingAnnouncement(isLoading: boolean, doneMessage: string) {
  const message = isLoading ? "Loading, please wait…" : doneMessage;
  return { ariaLive: "polite" as const, role: "status" as const, message };
}
