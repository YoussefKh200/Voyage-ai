// lib/utils/currency.ts

export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCostPerPerson(total: number, travelers: number): string {
  if (travelers <= 0) return formatCurrency(total);
  return formatCurrency(Math.round(total / travelers));
}
