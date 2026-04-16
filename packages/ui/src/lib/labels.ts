/**
 * Shared display label utilities for conditions and roles.
 */

const CONDITION_LABELS: Record<string, string> = {
  NM: 'Near Mint',
  LP: 'Lightly Played',
  MP: 'Moderately Played',
  HP: 'Heavily Played',
  D: 'Damaged',
};

/** Map a card condition code to its display label. */
export function conditionLabel(condition: string): string {
  return CONDITION_LABELS[condition] ?? condition;
}

/** Map a role value to a display label. */
export function roleLabel(role: string | null, fallback?: string): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'manager':
      return 'Store Manager';
    case 'member':
      return 'Employee';
    default:
      return fallback ?? role ?? 'Unknown';
  }
}
