// lib/utils/index.ts
// ─── Barrel export ────────────────────────────────────────────────────────────
// All utilities re-exported for backward compatibility.
// Prefer importing directly from the domain file in new code:
//   import { formatDate } from "@/lib/utils/date"
// Tree-shaking handles the rest.

export { cn } from "./cn";
export { formatDate, formatDateShort, getTripDuration, getDayLabel } from "./date";
export { formatCurrency, formatCostPerPerson } from "./currency";
export { capitalize, slugify, truncate, generateId } from "./string";
export { formatTime, minutesToHours } from "./time";

// groupBy kept here as it doesn't have a clear domain home
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const group = String(item[key]);
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    },
    {} as Record<string, T[]>
  );
}
