/**
 * Shared date utility functions.
 */

/** Convert a Date to ISO string, returning null for falsy values. */
export function formatDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/** Return today's date as YYYY-MM-DD. */
export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Validates that a string is a valid YYYY-MM-DD date.
 * Guards against JavaScript Date roll-over (e.g. Feb 30 → Mar 2) by
 * comparing the parsed date back to the original string.
 */
export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return d.toISOString().startsWith(s);
}

/**
 * Safely convert an unknown value to an ISO date string.
 * Falls back to the current time if the value is invalid.
 */
export function safeISOString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) {
    try {
      return value.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString();
  }
  return new Date().toISOString();
}
