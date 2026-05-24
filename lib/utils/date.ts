// lib/utils/date.ts
import { format, differenceInDays, parseISO } from "date-fns";

export function formatDate(date: string | Date, fmt = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, "MMM d");
}

export function getTripDuration(startDate: string, endDate: string): number {
  return Math.max(1, differenceInDays(parseISO(endDate), parseISO(startDate)) + 1);
}

export function getDayLabel(date: string): string {
  return format(parseISO(date), "EEEE, MMMM d");
}
