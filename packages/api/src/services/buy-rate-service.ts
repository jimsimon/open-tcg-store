import { eq, asc, and, inArray } from 'drizzle-orm';
import { otcgs } from '../db/otcgs/index';
import { storeSupportedGame } from '../db/otcgs/store-supported-game-schema';
import { buyRate } from '../db/otcgs/buy-rate-schema';
import { category } from '../db/tcg-data/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SupportedGameResult {
  categoryId: number;
  name: string;
  displayName: string;
}

export interface BuyRateEntryResult {
  id: number;
  description: string;
  rate: number;
  type: string;
  rarity: string | null;
  hidden: boolean;
  sortOrder: number;
}

export interface BuyRateTableResult {
  categoryId: number;
  gameName: string;
  gameDisplayName: string;
  entries: BuyRateEntryResult[];
}

export interface PublicBuyRatesResult {
  games: BuyRateTableResult[];
}

export interface BuyRateEntryInput {
  description: string;
  rate: number;
  type: string;
  rarity?: string | null;
  hidden?: boolean;
  sortOrder: number;
}

// ---------------------------------------------------------------------------
// Available Games (all categories in tcg-data)
// ---------------------------------------------------------------------------

export async function getAvailableGames(): Promise<SupportedGameResult[]> {
  const rows = await otcgs.select().from(category).orderBy(asc(category.displayName));

  return rows.map((row) => ({
    categoryId: row.id,
    name: row.name,
    displayName: row.displayName,
  }));
}

// ---------------------------------------------------------------------------
// Supported Games
// ---------------------------------------------------------------------------

export async function getSupportedGames(): Promise<SupportedGameResult[]> {
  const rows = await otcgs
    .select({
      categoryId: storeSupportedGame.categoryId,
      name: category.name,
      displayName: category.displayName,
    })
    .from(storeSupportedGame)
    .innerJoin(category, eq(storeSupportedGame.categoryId, category.id))
    .orderBy(asc(category.displayName));

  return rows;
}

export async function setSupportedGames(categoryIds: number[]): Promise<SupportedGameResult[]> {
  await otcgs.transaction(async (tx) => {
    // Get current supported games
    const currentGames = await tx.select({ categoryId: storeSupportedGame.categoryId }).from(storeSupportedGame);

    const currentCategoryIds = new Set(currentGames.map((g) => g.categoryId));
    const newCategoryIds = new Set(categoryIds);

    // Determine removed games
    const removedCategoryIds = [...currentCategoryIds].filter((id) => !newCategoryIds.has(id));

    // Delete buy rates for removed games (batched)
    if (removedCategoryIds.length > 0) {
      await tx.delete(buyRate).where(inArray(buyRate.categoryId, removedCategoryIds));
    }

    // Delete all existing supported game records
    await tx.delete(storeSupportedGame);

    // Insert new supported games
    if (categoryIds.length > 0) {
      await tx.insert(storeSupportedGame).values(
        categoryIds.map((catId) => ({
          categoryId: catId,
        })),
      );
    }
  });

  return getSupportedGames();
}

// ---------------------------------------------------------------------------
// Buy Rates (Admin)
// ---------------------------------------------------------------------------

export async function getBuyRates(categoryId: number): Promise<BuyRateEntryResult[]> {
  const rows = await otcgs
    .select()
    .from(buyRate)
    .where(eq(buyRate.categoryId, categoryId))
    .orderBy(asc(buyRate.sortOrder));

  return rows.map((row) => ({
    id: row.id,
    description: row.description,
    rate: row.rate,
    type: row.type ?? 'fixed',
    rarity: row.rarity ?? null,
    hidden: row.hidden ?? false,
    sortOrder: row.sortOrder,
  }));
}

export async function saveBuyRates(categoryId: number, entries: BuyRateEntryInput[]): Promise<BuyRateEntryResult[]> {
  // Validate entries
  for (const entry of entries) {
    if (entry.rate < 0) {
      throw new Error('Rate must not be negative');
    }
    if (!entry.description || entry.description.trim().length === 0) {
      throw new Error('Description must not be empty');
    }
    const validTypes = ['fixed', 'percentage'];
    if (entry.type && !validTypes.includes(entry.type)) {
      throw new Error(`Invalid type: ${entry.type}. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate all visible rarity-default rows have non-zero rates
  const visibleRarityEntries = entries.filter((e) => e.rarity && !e.hidden);
  for (const entry of visibleRarityEntries) {
    if (entry.rate <= 0) {
      throw new Error(`Buy rate for rarity "${entry.rarity}" must be greater than 0`);
    }
  }

  await otcgs.transaction(async (tx) => {
    // Delete existing entries for this game
    await tx.delete(buyRate).where(eq(buyRate.categoryId, categoryId));

    // Insert new entries
    if (entries.length > 0) {
      await tx.insert(buyRate).values(
        entries.map((entry) => ({
          categoryId,
          description: entry.description,
          rate: entry.rate,
          type: entry.type || 'fixed',
          rarity: entry.rarity || null,
          hidden: entry.hidden ?? false,
          sortOrder: entry.sortOrder,
        })),
      );
    }
  });

  return getBuyRates(categoryId);
}

export async function deleteBuyRates(categoryId: number): Promise<boolean> {
  await otcgs.delete(buyRate).where(eq(buyRate.categoryId, categoryId));

  return true;
}

// ---------------------------------------------------------------------------
// Public Buy Rates
// ---------------------------------------------------------------------------

export async function getPublicBuyRates(): Promise<PublicBuyRatesResult> {
  // Get all supported games (company-wide setting)
  const supportedGames = await otcgs
    .select({
      categoryId: storeSupportedGame.categoryId,
      name: category.name,
      displayName: category.displayName,
    })
    .from(storeSupportedGame)
    .innerJoin(category, eq(storeSupportedGame.categoryId, category.id))
    .orderBy(asc(category.displayName));

  if (supportedGames.length === 0) {
    return { games: [] };
  }

  // Get all visible buy rates for all supported games in one query
  const allRates = await otcgs
    .select()
    .from(buyRate)
    .where(
      and(
        inArray(
          buyRate.categoryId,
          supportedGames.map((g) => g.categoryId),
        ),
        eq(buyRate.hidden, false),
      ),
    )
    .orderBy(asc(buyRate.sortOrder));

  // Group rates by categoryId
  const ratesByCategory = new Map<number, BuyRateEntryResult[]>();
  for (const rate of allRates) {
    const existing = ratesByCategory.get(rate.categoryId) ?? [];
    existing.push({
      id: rate.id,
      description: rate.description,
      rate: rate.rate,
      type: rate.type ?? 'fixed',
      rarity: rate.rarity ?? null,
      hidden: false,
      sortOrder: rate.sortOrder,
    });
    ratesByCategory.set(rate.categoryId, existing);
  }

  // Build result — only include games that have buy rate entries
  const games: BuyRateTableResult[] = supportedGames
    .filter((game) => {
      const entries = ratesByCategory.get(game.categoryId);
      return entries && entries.length > 0;
    })
    .map((game) => ({
      categoryId: game.categoryId,
      gameName: game.name,
      gameDisplayName: game.displayName,
      entries: ratesByCategory.get(game.categoryId) ?? [],
    }));

  return { games };
}
