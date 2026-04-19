/** Display labels for event type enum values. */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  TOURNAMENT: 'Tournament',
  CASUAL_PLAY: 'Casual Play',
  DRAFT: 'Draft',
  RELEASE_EVENT: 'Release Event',
  LEAGUE: 'League',
  PRERELEASE: 'Prerelease',
  OTHER: 'Other',
};

/** Color palette for event type chips (calendar view). Uses Web Awesome palette tokens (5-95 scale). */
export const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  TOURNAMENT: { bg: 'var(--wa-color-blue-95)', text: 'var(--wa-color-blue-20)', border: 'var(--wa-color-blue-60)' },
  CASUAL_PLAY: {
    bg: 'var(--wa-color-green-95)',
    text: 'var(--wa-color-green-20)',
    border: 'var(--wa-color-green-60)',
  },
  DRAFT: {
    bg: 'var(--wa-color-purple-95)',
    text: 'var(--wa-color-purple-20)',
    border: 'var(--wa-color-purple-60)',
  },
  RELEASE_EVENT: {
    bg: 'var(--wa-color-yellow-95)',
    text: 'var(--wa-color-orange-20)',
    border: 'var(--wa-color-yellow-60)',
  },
  PRERELEASE: { bg: 'var(--wa-color-pink-95)', text: 'var(--wa-color-pink-20)', border: 'var(--wa-color-pink-60)' },
  LEAGUE: { bg: 'var(--wa-color-cyan-95)', text: 'var(--wa-color-cyan-20)', border: 'var(--wa-color-cyan-60)' },
  OTHER: { bg: 'var(--wa-color-gray-95)', text: 'var(--wa-color-gray-20)', border: 'var(--wa-color-gray-60)' },
};

/** Format an event type enum value into a human-readable label. */
export function formatEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format an entry fee in cents as a currency string, or "Free" if null/zero. */
export function formatEntryFee(cents: number | null): string {
  if (cents == null || cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

/** Format an ISO timestamp as a short time string (e.g., "7:00 PM"). */
export function formatTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return isoStr;
  }
}

/** Format an ISO timestamp as a full date string (e.g., "Saturday, April 19, 2026"). */
export function formatFullDate(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoStr;
  }
}

/** Get the color scheme for an event type chip. */
export function getEventColor(eventType: string): { bg: string; text: string; border: string } {
  return EVENT_TYPE_COLORS[eventType] ?? EVENT_TYPE_COLORS['OTHER'];
}
