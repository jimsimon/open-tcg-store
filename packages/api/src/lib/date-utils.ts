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
 * Returns null if the value is falsy or cannot be parsed as a valid date,
 * rather than silently falling back to the current time.
 */
export function safeISOString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    try {
      const iso = value.toISOString();
      return Number.isNaN(value.getTime()) ? null : iso;
    } catch {
      return null;
    }
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === 'number') {
    // Detect whether the value is seconds or milliseconds.
    // Timestamps above 1e12 (~2001 in ms) are treated as milliseconds;
    // below that threshold they're treated as Unix seconds.
    const ms = value > 1e12 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}
