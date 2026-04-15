/**
 * Monetary values arrive from the API as integer cents.
 * These utilities convert cents to display strings.
 */

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format integer cents as a USD currency string (e.g. 1999 -> "$19.99").
 * Returns '—' for null/undefined (unknown value). Callers that want '$0.00'
 * for null should pass `?? 0` explicitly.
 */
export function formatCurrency(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return usdFormatter.format(cents / 100);
}

/** Convert integer cents to a dollar number for input fields (e.g. 1999 -> 19.99). */
export function centsToInputValue(cents: number): number {
  return cents / 100;
}

/** Convert a dollar input value to integer cents (e.g. 19.99 -> 1999). */
export function inputValueToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
