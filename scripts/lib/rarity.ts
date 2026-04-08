/**
 * Maps single-letter Magic: The Gathering rarity codes (from TCGplayer
 * extendedData) to human-readable names.
 *
 * Applied at data-ingestion time in scripts/populate-tcg-data.ts so every
 * downstream consumer sees consistent labels without additional mapping.
 *
 * Unknown codes are returned as-is so we never silently swallow a new
 * rarity that TCGplayer starts sending.
 */

const RARITY_MAP: Record<string, string> = {
  C: 'Common',
  L: 'Land',
  M: 'Mythic Rare',
  P: 'Promo',
  R: 'Rare',
  S: 'Special',
  T: 'Token',
  U: 'Uncommon',
};

/** Expand a raw rarity value to its full name, or return the original value if no mapping exists. */
export function mapRarity(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  return RARITY_MAP[raw] ?? raw;
}
