/**
 * Monetary values are stored as integer cents throughout the system to avoid
 * IEEE 754 floating-point rounding errors (e.g. 0.1 + 0.2 !== 0.3).
 *
 * - DB columns store integer cents (e.g. 1999 = $19.99)
 * - GraphQL `Int` fields transmit cents
 * - UI divides by 100 for display
 *
 * These utilities handle conversion at system boundaries.
 */

/** Convert a dollar amount (float) to integer cents. Rounds to nearest cent. */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert integer cents to a dollar amount (float). */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Convert integer cents to a formatted dollar string (e.g. "19.99"). No $ prefix. */
export function centsToFixed(cents: number): string {
  return (cents / 100).toFixed(2);
}
