import { eq, and, asc, inArray } from 'drizzle-orm';
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

export async function getSupportedGames(orgId: string): Promise<SupportedGameResult[]> {
  const rows = await otcgs
    .select({
      categoryId: storeSupportedGame.categoryId,
      name: category.name,
      displayName: category.displayName,
    })
    .from(storeSupportedGame)
    .innerJoin(category, eq(storeSupportedGame.categoryId, category.id))
    .where(eq(storeSupportedGame.organizationId, orgId))
    .orderBy(asc(category.displayName));

  return rows;
}

export async function setSupportedGames(orgId: string, categoryIds: number[]): Promise<SupportedGameResult[]> {
  await otcgs.transaction(async (tx) => {
    // Get current supported games
    const currentGames = await tx
      .select({ categoryId: storeSupportedGame.categoryId })
      .from(storeSupportedGame)
      .where(eq(storeSupportedGame.organizationId, orgId));

    const currentCategoryIds = new Set(currentGames.map((g) => g.categoryId));
    const newCategoryIds = new Set(categoryIds);

    // Determine removed games
    const removedCategoryIds = [...currentCategoryIds].filter((id) => !newCategoryIds.has(id));

    // Delete buy rates for removed games
    if (removedCategoryIds.length > 0) {
      for (const catId of removedCategoryIds) {
        await tx.delete(buyRate).where(and(eq(buyRate.organizationId, orgId), eq(buyRate.categoryId, catId)));
      }
    }

    // Delete all existing supported game records for this org
    await tx.delete(storeSupportedGame).where(eq(storeSupportedGame.organizationId, orgId));

    // Insert new supported games
    if (categoryIds.length > 0) {
      await tx.insert(storeSupportedGame).values(
        categoryIds.map((catId) => ({
          organizationId: orgId,
          categoryId: catId,
        })),
      );
    }
  });

  return getSupportedGames(orgId);
}

// ---------------------------------------------------------------------------
// Buy Rates (Admin)
// ---------------------------------------------------------------------------

export async function getBuyRates(orgId: string, categoryId: number): Promise<BuyRateEntryResult[]> {
  const rows = await otcgs
    .select()
    .from(buyRate)
    .where(and(eq(buyRate.organizationId, orgId), eq(buyRate.categoryId, categoryId)))
    .orderBy(asc(buyRate.sortOrder));

  return rows.map((row) => ({
    id: row.id,
    description: row.description,
    rate: row.rate,
    sortOrder: row.sortOrder,
  }));
}

export async function saveBuyRates(
  orgId: string,
  categoryId: number,
  entries: BuyRateEntryInput[],
): Promise<BuyRateEntryResult[]> {
  // Validate entries
  for (const entry of entries) {
    if (entry.rate < 0) {
      throw new Error('Rate must not be negative');
    }
    if (!entry.description || entry.description.trim().length === 0) {
      throw new Error('Description must not be empty');
    }
  }

  await otcgs.transaction(async (tx) => {
    // Delete existing entries for this org+game
    await tx.delete(buyRate).where(and(eq(buyRate.organizationId, orgId), eq(buyRate.categoryId, categoryId)));

    // Insert new entries
    if (entries.length > 0) {
      await tx.insert(buyRate).values(
        entries.map((entry) => ({
          organizationId: orgId,
          categoryId,
          description: entry.description,
          rate: entry.rate,
          sortOrder: entry.sortOrder,
        })),
      );
    }
  });

  return getBuyRates(orgId, categoryId);
}

export async function deleteBuyRates(orgId: string, categoryId: number): Promise<boolean> {
  await otcgs.delete(buyRate).where(and(eq(buyRate.organizationId, orgId), eq(buyRate.categoryId, categoryId)));

  return true;
}

// ---------------------------------------------------------------------------
// Public Buy Rates
// ---------------------------------------------------------------------------

export async function getPublicBuyRates(orgId: string): Promise<PublicBuyRatesResult> {
  // Get all supported games for this org
  const supportedGames = await otcgs
    .select({
      categoryId: storeSupportedGame.categoryId,
      name: category.name,
      displayName: category.displayName,
    })
    .from(storeSupportedGame)
    .innerJoin(category, eq(storeSupportedGame.categoryId, category.id))
    .where(eq(storeSupportedGame.organizationId, orgId))
    .orderBy(asc(category.displayName));

  if (supportedGames.length === 0) {
    return { games: [] };
  }

  // Get all buy rates for all supported games in one query
  const allRates = await otcgs
    .select()
    .from(buyRate)
    .where(
      and(
        eq(buyRate.organizationId, orgId),
        inArray(
          buyRate.categoryId,
          supportedGames.map((g) => g.categoryId),
        ),
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
