import { eq, and, sql, inArray } from 'drizzle-orm';
import { otcgs, inventoryItem, inventoryItemStock } from '../db/otcgs/index';
import { lot } from '../db/otcgs/lot-schema';
import { lotItem } from '../db/otcgs/lot-item-schema';
import { product, group, category, productExtendedData, price } from '../db/tcg-data/schema';
import { logTransaction } from './transaction-log-service';
import { likeEscaped } from '../lib/sql-utils';
import type { PaginationInput } from '../schema/types.generated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LotItemInput {
  id?: number | null;
  productId: number;
  condition?: string | null;
  quantity: number;
  costBasis: number;
  costOverridden: boolean;
}

interface CreateLotInput {
  name: string;
  description?: string | null;
  amountPaid: number;
  acquisitionDate: string;
  items: LotItemInput[];
}

interface UpdateLotInput extends CreateLotInput {
  id: number;
}

interface LotFilters {
  searchTerm?: string | null;
}

interface LotItemResult {
  id: number;
  lotId: number;
  productId: number;
  productName: string;
  gameName: string;
  setName: string;
  rarity: string | null;
  isSingle: boolean;
  isSealed: boolean;
  condition: string | null;
  quantity: number;
  costBasis: number;
  costOverridden: boolean;
  marketValue: number | null;
}

interface LotResult {
  id: number;
  organizationId: string;
  name: string;
  description: string | null;
  amountPaid: number;
  acquisitionDate: string;
  items: LotItemResult[];
  totalMarketValue: number;
  totalCost: number;
  projectedProfitLoss: number;
  projectedProfitMargin: number;
  createdAt: string;
  updatedAt: string;
}

interface LotPageResult {
  lots: LotResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function validateLotInput(input: CreateLotInput): void {
  if (!input.name || input.name.trim().length === 0) throw new Error('Lot name is required');
  if (input.amountPaid == null || input.amountPaid < 0) throw new Error('Amount paid must be non-negative');
  if (!input.acquisitionDate) throw new Error('Acquisition date is required');
  if (!input.items || input.items.length === 0) throw new Error('At least one item is required');

  const validConditions = ['NM', 'LP', 'MP', 'HP', 'D'];
  for (const item of input.items) {
    if (!item.productId) throw new Error('Each item must have a productId');
    if (item.quantity == null || item.quantity < 1) throw new Error('Each item must have a quantity >= 1');
    if (item.costBasis == null || item.costBasis < 0) throw new Error('Each item must have a non-negative costBasis');
    if (item.condition != null && !validConditions.includes(item.condition)) {
      throw new Error(`Invalid condition: ${item.condition}. Must be one of: ${validConditions.join(', ')}`);
    }
  }

  // Validate cost total matches amount paid
  const totalCost = input.items.reduce((sum, item) => sum + item.costBasis * item.quantity, 0);
  if (Math.abs(totalCost - input.amountPaid) > 0.01) {
    throw new Error(
      `Total cost ($${totalCost.toFixed(2)}) does not match amount paid ($${input.amountPaid.toFixed(2)})`,
    );
  }
}

async function buildLotItemResults(lotId: number): Promise<LotItemResult[]> {
  const items = await otcgs
    .select({
      id: lotItem.id,
      lotId: lotItem.lotId,
      productId: lotItem.productId,
      productName: product.name,
      gameName: category.name,
      setName: group.name,
      condition: lotItem.condition,
      quantity: lotItem.quantity,
      costBasis: lotItem.costBasis,
      costOverridden: lotItem.costOverridden,
      rarity: sql<string | null>`(
        SELECT ${productExtendedData.value}
        FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND ${productExtendedData.name} = 'Rarity'
        LIMIT 1
      )`.as('rarity'),
      isSingle: sql<boolean>`(
        EXISTS (
          SELECT 1 FROM ${productExtendedData}
          WHERE ${productExtendedData.productId} = ${product.id}
            AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
        )
      )`.as('is_single'),
    })
    .from(lotItem)
    .innerJoin(product, eq(lotItem.productId, product.id))
    .leftJoin(group, eq(product.groupId, group.id))
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(eq(lotItem.lotId, lotId));

  // Fetch market prices for all products
  const productIds = items.map((i) => i.productId);
  const priceRows =
    productIds.length > 0
      ? await otcgs
          .select({
            productId: price.productId,
            subTypeName: price.subTypeName,
            marketPrice: price.marketPrice,
            midPrice: price.midPrice,
          })
          .from(price)
          .where(inArray(price.productId, productIds))
      : [];

  // Build market value map (prefer marketPrice from Normal subtype, fallback to midPrice)
  const marketValueByProduct = new Map<number, number>();
  for (const pr of priceRows) {
    if (pr.productId == null) continue;
    // Prefer Normal subtype, but take any if Normal not available
    const existing = marketValueByProduct.get(pr.productId);
    if (existing == null || pr.subTypeName === 'Normal') {
      marketValueByProduct.set(pr.productId, pr.marketPrice ?? pr.midPrice ?? 0);
    }
  }

  return items.map((item) => {
    const isSingle = Boolean(item.isSingle);
    const unitMarketValue = marketValueByProduct.get(item.productId) ?? null;
    return {
      id: item.id,
      lotId: item.lotId,
      productId: item.productId,
      productName: item.productName ?? '',
      gameName: item.gameName ?? '',
      setName: item.setName ?? '',
      rarity: item.rarity ?? null,
      isSingle,
      isSealed: !isSingle,
      condition: item.condition ?? null,
      quantity: item.quantity,
      costBasis: item.costBasis,
      costOverridden: Boolean(item.costOverridden),
      marketValue: unitMarketValue != null ? unitMarketValue * item.quantity : null,
    };
  });
}

function computeLotSummary(items: LotItemResult[]) {
  let totalMarketValue = 0;
  let totalCost = 0;
  for (const item of items) {
    totalCost += item.costBasis * item.quantity;
    totalMarketValue += item.marketValue ?? 0;
  }
  const projectedProfitLoss = totalMarketValue - totalCost;
  const projectedProfitMargin = totalMarketValue > 0 ? ((totalMarketValue - totalCost) / totalMarketValue) * 100 : 0;

  return { totalMarketValue, totalCost, projectedProfitLoss, projectedProfitMargin };
}

async function buildLotResult(lotRow: typeof lot.$inferSelect): Promise<LotResult> {
  const items = await buildLotItemResults(lotRow.id);
  const summary = computeLotSummary(items);

  return {
    id: lotRow.id,
    organizationId: lotRow.organizationId,
    name: lotRow.name,
    description: lotRow.description ?? null,
    amountPaid: lotRow.amountPaid,
    acquisitionDate: lotRow.acquisitionDate,
    items,
    ...summary,
    createdAt: formatDate(lotRow.createdAt) ?? new Date().toISOString(),
    updatedAt: formatDate(lotRow.updatedAt) ?? new Date().toISOString(),
  };
}

/**
 * Batch variant of buildLotResult — fetches all lot items and prices for
 * multiple lots in 2 queries instead of 2*N.
 */
async function buildLotResults(lotRows: (typeof lot.$inferSelect)[]): Promise<LotResult[]> {
  const lotIds = lotRows.map((r) => r.id);
  if (lotIds.length === 0) return [];

  // Fetch all items for all lots in one query
  const allItems = await otcgs
    .select({
      id: lotItem.id,
      lotId: lotItem.lotId,
      productId: lotItem.productId,
      productName: product.name,
      gameName: category.name,
      setName: group.name,
      condition: lotItem.condition,
      quantity: lotItem.quantity,
      costBasis: lotItem.costBasis,
      costOverridden: lotItem.costOverridden,
      rarity: sql<string | null>`(
        SELECT ${productExtendedData.value}
        FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND ${productExtendedData.name} = 'Rarity'
        LIMIT 1
      )`.as('rarity'),
      isSingle: sql<boolean>`(
        EXISTS (
          SELECT 1 FROM ${productExtendedData}
          WHERE ${productExtendedData.productId} = ${product.id}
            AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
        )
      )`.as('is_single'),
    })
    .from(lotItem)
    .innerJoin(product, eq(lotItem.productId, product.id))
    .leftJoin(group, eq(product.groupId, group.id))
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(inArray(lotItem.lotId, lotIds));

  // Fetch market prices for all distinct products across all lots
  const allProductIds = [...new Set(allItems.map((i) => i.productId))];
  const priceRows =
    allProductIds.length > 0
      ? await otcgs
          .select({
            productId: price.productId,
            subTypeName: price.subTypeName,
            marketPrice: price.marketPrice,
            midPrice: price.midPrice,
          })
          .from(price)
          .where(inArray(price.productId, allProductIds))
      : [];

  // Build market value map
  const marketValueByProduct = new Map<number, number>();
  for (const pr of priceRows) {
    if (pr.productId == null) continue;
    const existing = marketValueByProduct.get(pr.productId);
    if (existing == null || pr.subTypeName === 'Normal') {
      marketValueByProduct.set(pr.productId, pr.marketPrice ?? pr.midPrice ?? 0);
    }
  }

  // Group items by lotId and build results
  const itemsByLot = new Map<number, typeof allItems>();
  for (const item of allItems) {
    const arr = itemsByLot.get(item.lotId) ?? [];
    arr.push(item);
    itemsByLot.set(item.lotId, arr);
  }

  return lotRows.map((lotRow) => {
    const rawItems = itemsByLot.get(lotRow.id) ?? [];
    const items: LotItemResult[] = rawItems.map((item) => {
      const isSingle = Boolean(item.isSingle);
      const unitMarketValue = marketValueByProduct.get(item.productId) ?? null;
      return {
        id: item.id,
        lotId: item.lotId,
        productId: item.productId,
        productName: item.productName,
        gameName: item.gameName ?? '',
        setName: item.setName ?? '',
        rarity: item.rarity ?? null,
        isSingle,
        isSealed: !isSingle,
        condition: item.condition ?? null,
        quantity: item.quantity,
        costBasis: item.costBasis,
        costOverridden: Boolean(item.costOverridden),
        marketValue: unitMarketValue != null ? unitMarketValue * item.quantity : null,
      };
    });

    const summary = computeLotSummary(items);

    return {
      id: lotRow.id,
      organizationId: lotRow.organizationId,
      name: lotRow.name,
      description: lotRow.description ?? null,
      amountPaid: lotRow.amountPaid,
      acquisitionDate: lotRow.acquisitionDate,
      items,
      ...summary,
      createdAt: formatDate(lotRow.createdAt) ?? new Date().toISOString(),
      updatedAt: formatDate(lotRow.updatedAt) ?? new Date().toISOString(),
    };
  });
}

// ---------------------------------------------------------------------------
// Database handle type — accepts either the top-level otcgs or a transaction
// ---------------------------------------------------------------------------

type DbHandle = Pick<typeof otcgs, 'select' | 'insert' | 'update' | 'delete'>;

// ---------------------------------------------------------------------------
// findOrCreateInventoryItem — Reuse pattern from inventory-service
// ---------------------------------------------------------------------------

async function findOrCreateInventoryItem(
  db: DbHandle,
  organizationId: string,
  productId: number,
  condition: string,
  sellPrice: number,
  userId: string,
): Promise<number> {
  const now = new Date();

  const [existing] = await db
    .select()
    .from(inventoryItem)
    .where(
      and(
        eq(inventoryItem.organizationId, organizationId),
        eq(inventoryItem.productId, productId),
        eq(inventoryItem.condition, condition),
      ),
    )
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [inserted] = await db
    .insert(inventoryItem)
    .values({
      organizationId,
      productId,
      condition,
      price: sellPrice,
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return inserted.id;
}

// ---------------------------------------------------------------------------
// getMarketPriceForProduct — helper to fetch sell price for new inventory items
// ---------------------------------------------------------------------------

async function getMarketPriceForProduct(db: DbHandle, productId: number): Promise<number> {
  const priceRows = await db
    .select({
      subTypeName: price.subTypeName,
      marketPrice: price.marketPrice,
      midPrice: price.midPrice,
    })
    .from(price)
    .where(eq(price.productId, productId));

  // Prefer Normal subtype
  const normalPrice = priceRows.find((p) => p.subTypeName === 'Normal');
  const fallback = priceRows[0];
  const priceRow = normalPrice ?? fallback;
  return priceRow?.marketPrice ?? priceRow?.midPrice ?? 0;
}

// ---------------------------------------------------------------------------
// createLot
// ---------------------------------------------------------------------------

export async function createLot(organizationId: string, input: CreateLotInput, userId: string): Promise<LotResult> {
  validateLotInput(input);

  const now = new Date();

  const lotRow = await otcgs.transaction(async (tx) => {
    // Create lot record
    const [newLot] = await tx
      .insert(lot)
      .values({
        organizationId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        amountPaid: input.amountPaid,
        acquisitionDate: input.acquisitionDate,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create lot items and corresponding inventory entries
    for (const item of input.items) {
      const condition = item.condition ?? 'NM';
      const sellPrice = await getMarketPriceForProduct(tx, item.productId);
      const parentId = await findOrCreateInventoryItem(
        tx,
        organizationId,
        item.productId,
        condition,
        sellPrice,
        userId,
      );

      // Create stock entry with lot reference
      // Check for existing stock with same costBasis + acquisitionDate (unique index)
      const [existingStock] = await tx
        .select()
        .from(inventoryItemStock)
        .where(
          and(
            eq(inventoryItemStock.inventoryItemId, parentId),
            eq(inventoryItemStock.costBasis, item.costBasis),
            eq(inventoryItemStock.acquisitionDate, input.acquisitionDate),
          ),
        )
        .limit(1);

      let stockId: number;

      if (existingStock) {
        const baseQty = existingStock.deletedAt ? 0 : existingStock.quantity;
        await tx
          .update(inventoryItemStock)
          .set({
            quantity: baseQty + item.quantity,
            lotId: newLot.id,
            deletedAt: null,
            updatedBy: userId,
            updatedAt: now,
          })
          .where(eq(inventoryItemStock.id, existingStock.id));
        stockId = existingStock.id;
      } else {
        const [inserted] = await tx
          .insert(inventoryItemStock)
          .values({
            inventoryItemId: parentId,
            quantity: item.quantity,
            costBasis: item.costBasis,
            acquisitionDate: input.acquisitionDate,
            lotId: newLot.id,
            createdBy: userId,
            updatedBy: userId,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        stockId = inserted.id;
      }

      // Create lot item record
      await tx.insert(lotItem).values({
        lotId: newLot.id,
        productId: item.productId,
        condition: item.condition ?? null,
        quantity: item.quantity,
        costBasis: item.costBasis,
        costOverridden: item.costOverridden ? 1 : 0,
        inventoryItemStockId: stockId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return newLot;
  });

  // Log transaction (outside DB transaction — logging failure shouldn't roll back the lot)
  await logTransaction({
    organizationId,
    userId,
    action: 'lot.created',
    resourceType: 'lot',
    resourceId: lotRow.id,
    details: {
      name: input.name,
      amountPaid: input.amountPaid,
      itemCount: input.items.length,
    },
  });

  return buildLotResult(lotRow);
}

// ---------------------------------------------------------------------------
// updateLot
// ---------------------------------------------------------------------------

export async function updateLot(input: UpdateLotInput, userId: string, organizationId: string): Promise<LotResult> {
  validateLotInput(input);

  const now = new Date();

  // Verify lot exists and belongs to org (outside transaction — read-only check)
  const [existingLot] = await otcgs
    .select()
    .from(lot)
    .where(and(eq(lot.id, input.id), eq(lot.organizationId, organizationId)))
    .limit(1);

  if (!existingLot) throw new Error('Lot not found');

  await otcgs.transaction(async (tx) => {
    // Update lot metadata
    await tx
      .update(lot)
      .set({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        amountPaid: input.amountPaid,
        acquisitionDate: input.acquisitionDate,
        updatedBy: userId,
        updatedAt: now,
      })
      .where(eq(lot.id, input.id));

    // Get existing lot items
    const existingItems = await tx.select().from(lotItem).where(eq(lotItem.lotId, input.id));
    const existingItemMap = new Map(existingItems.map((i) => [i.id, i]));

    // Determine which items to add, update, or remove
    const inputItemIds = new Set(input.items.filter((i) => i.id != null).map((i) => i.id!));
    const removedItems = existingItems.filter((i) => !inputItemIds.has(i.id));

    // Remove items: batch soft-delete associated stock entries, batch delete lot items
    if (removedItems.length > 0) {
      const stockIdsToDelete = removedItems.filter((r) => r.inventoryItemStockId).map((r) => r.inventoryItemStockId!);
      if (stockIdsToDelete.length > 0) {
        await tx
          .update(inventoryItemStock)
          .set({ quantity: 0, deletedAt: now, updatedBy: userId, updatedAt: now })
          .where(inArray(inventoryItemStock.id, stockIdsToDelete));
      }
      await tx.delete(lotItem).where(
        inArray(
          lotItem.id,
          removedItems.map((r) => r.id),
        ),
      );
    }

    // Process input items
    for (const item of input.items) {
      const condition = item.condition ?? 'NM';

      if (item.id != null && existingItemMap.has(item.id)) {
        // Update existing item
        const existing = existingItemMap.get(item.id)!;

        // Update lot item record
        await tx
          .update(lotItem)
          .set({
            productId: item.productId,
            condition: item.condition ?? null,
            quantity: item.quantity,
            costBasis: item.costBasis,
            costOverridden: item.costOverridden ? 1 : 0,
            updatedAt: now,
          })
          .where(eq(lotItem.id, item.id));

        // Update associated stock entry
        if (existing.inventoryItemStockId) {
          await tx
            .update(inventoryItemStock)
            .set({
              quantity: item.quantity,
              costBasis: item.costBasis,
              updatedBy: userId,
              updatedAt: now,
            })
            .where(eq(inventoryItemStock.id, existing.inventoryItemStockId));
        }
      } else {
        // New item — create inventory + stock + lot item
        const sellPrice = await getMarketPriceForProduct(tx, item.productId);
        const parentId = await findOrCreateInventoryItem(
          tx,
          organizationId,
          item.productId,
          condition,
          sellPrice,
          userId,
        );

        const [existingStock] = await tx
          .select()
          .from(inventoryItemStock)
          .where(
            and(
              eq(inventoryItemStock.inventoryItemId, parentId),
              eq(inventoryItemStock.costBasis, item.costBasis),
              eq(inventoryItemStock.acquisitionDate, input.acquisitionDate),
            ),
          )
          .limit(1);

        let stockId: number;

        if (existingStock) {
          const baseQty = existingStock.deletedAt ? 0 : existingStock.quantity;
          await tx
            .update(inventoryItemStock)
            .set({
              quantity: baseQty + item.quantity,
              lotId: input.id,
              deletedAt: null,
              updatedBy: userId,
              updatedAt: now,
            })
            .where(eq(inventoryItemStock.id, existingStock.id));
          stockId = existingStock.id;
        } else {
          const [inserted] = await tx
            .insert(inventoryItemStock)
            .values({
              inventoryItemId: parentId,
              quantity: item.quantity,
              costBasis: item.costBasis,
              acquisitionDate: input.acquisitionDate,
              lotId: input.id,
              createdBy: userId,
              updatedBy: userId,
              createdAt: now,
              updatedAt: now,
            })
            .returning();
          stockId = inserted.id;
        }

        await tx.insert(lotItem).values({
          lotId: input.id,
          productId: item.productId,
          condition: item.condition ?? null,
          quantity: item.quantity,
          costBasis: item.costBasis,
          costOverridden: item.costOverridden ? 1 : 0,
          inventoryItemStockId: stockId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  });

  // Log transaction (outside DB transaction — logging failure shouldn't roll back the update)
  await logTransaction({
    organizationId,
    userId,
    action: 'lot.updated',
    resourceType: 'lot',
    resourceId: input.id,
    details: {
      name: input.name,
      amountPaid: input.amountPaid,
      itemCount: input.items.length,
    },
  });

  const [updatedLot] = await otcgs.select().from(lot).where(eq(lot.id, input.id)).limit(1);
  return buildLotResult(updatedLot);
}

// ---------------------------------------------------------------------------
// deleteLot
// ---------------------------------------------------------------------------

export async function deleteLot(id: number, organizationId: string, userId: string): Promise<boolean> {
  const now = new Date();

  // Verify lot exists and belongs to org (outside transaction — read-only check)
  const [existingLot] = await otcgs
    .select()
    .from(lot)
    .where(and(eq(lot.id, id), eq(lot.organizationId, organizationId)))
    .limit(1);

  if (!existingLot) throw new Error('Lot not found');

  await otcgs.transaction(async (tx) => {
    // Soft-delete all stock entries associated with this lot
    await tx
      .update(inventoryItemStock)
      .set({ quantity: 0, deletedAt: now, updatedBy: userId, updatedAt: now })
      .where(eq(inventoryItemStock.lotId, id));

    // Delete lot items
    await tx.delete(lotItem).where(eq(lotItem.lotId, id));

    // Delete the lot
    await tx.delete(lot).where(eq(lot.id, id));
  });

  // Log transaction (outside DB transaction — logging failure shouldn't roll back the delete)
  await logTransaction({
    organizationId,
    userId,
    action: 'lot.deleted',
    resourceType: 'lot',
    resourceId: id,
    details: {
      name: existingLot.name,
    },
  });

  return true;
}

// ---------------------------------------------------------------------------
// getLotStats
// ---------------------------------------------------------------------------

export interface LotStatsResult {
  totalLots: number;
  totalInvested: number;
  totalMarketValue: number;
  totalProfitLoss: number;
}

export async function getLotStats(organizationId: string): Promise<LotStatsResult> {
  // Total lots and total invested (sum of amountPaid) from the lot table
  const [lotAgg] = await otcgs
    .select({
      totalLots: sql<number>`count(*)`,
      totalInvested: sql<number>`coalesce(sum(${lot.amountPaid}), 0)`,
    })
    .from(lot)
    .where(eq(lot.organizationId, organizationId));

  const totalLots = Number(lotAgg?.totalLots ?? 0);
  const totalInvested = Number(lotAgg?.totalInvested ?? 0);

  if (totalLots === 0) {
    return { totalLots: 0, totalInvested: 0, totalMarketValue: 0, totalProfitLoss: 0 };
  }

  // Fetch all lot items using a subquery to avoid a separate lot ID round trip
  const orgLotIds = otcgs.select({ id: lot.id }).from(lot).where(eq(lot.organizationId, organizationId));

  const items = await otcgs
    .select({
      productId: lotItem.productId,
      quantity: lotItem.quantity,
    })
    .from(lotItem)
    .where(inArray(lotItem.lotId, orgLotIds));

  // Fetch market prices for all referenced products
  const productIds = [...new Set(items.map((i) => i.productId))];
  const priceRows =
    productIds.length > 0
      ? await otcgs
          .select({
            productId: price.productId,
            subTypeName: price.subTypeName,
            marketPrice: price.marketPrice,
            midPrice: price.midPrice,
          })
          .from(price)
          .where(inArray(price.productId, productIds))
      : [];

  // Build market value map (prefer Normal subtype, same logic as buildLotItemResults)
  const marketValueByProduct = new Map<number, number>();
  for (const pr of priceRows) {
    if (pr.productId == null) continue;
    const existing = marketValueByProduct.get(pr.productId);
    if (existing == null || pr.subTypeName === 'Normal') {
      marketValueByProduct.set(pr.productId, pr.marketPrice ?? pr.midPrice ?? 0);
    }
  }

  // Sum total market value across all lot items
  let totalMarketValue = 0;
  for (const item of items) {
    const unitPrice = marketValueByProduct.get(item.productId) ?? 0;
    totalMarketValue += unitPrice * item.quantity;
  }

  const totalProfitLoss = totalMarketValue - totalInvested;

  return { totalLots, totalInvested, totalMarketValue, totalProfitLoss };
}

// ---------------------------------------------------------------------------
// getLots
// ---------------------------------------------------------------------------

export async function getLots(
  organizationId: string,
  filters?: LotFilters | null,
  pagination?: PaginationInput | null,
): Promise<LotPageResult> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(lot.organizationId, organizationId)];

  if (filters?.searchTerm) {
    conditions.push(likeEscaped(lot.name, filters.searchTerm));
  }

  const whereClause = and(...conditions);

  // Count
  const [countResult] = await otcgs
    .select({ total: sql<number>`count(*)` })
    .from(lot)
    .where(whereClause);

  const totalCount = Number(countResult?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Data
  const rows = await otcgs
    .select()
    .from(lot)
    .where(whereClause)
    .orderBy(sql`${lot.createdAt} DESC`)
    .limit(pageSize)
    .offset(offset);

  const lots = await buildLotResults(rows);

  return { lots, totalCount, page, pageSize, totalPages };
}

// ---------------------------------------------------------------------------
// getLot
// ---------------------------------------------------------------------------

export async function getLot(id: number, organizationId: string): Promise<LotResult | null> {
  const [lotRow] = await otcgs
    .select()
    .from(lot)
    .where(and(eq(lot.id, id), eq(lot.organizationId, organizationId)))
    .limit(1);
  if (!lotRow) return null;
  return buildLotResult(lotRow);
}

// ---------------------------------------------------------------------------
// getDistinctRarities
// ---------------------------------------------------------------------------

export async function getDistinctRarities(categoryId: number): Promise<string[]> {
  const rows = await otcgs
    .select({
      value: productExtendedData.value,
    })
    .from(productExtendedData)
    .innerJoin(product, eq(productExtendedData.productId, product.id))
    .where(and(eq(product.categoryId, categoryId), eq(productExtendedData.name, 'Rarity')))
    .groupBy(productExtendedData.value)
    .orderBy(productExtendedData.value);

  return rows.map((r) => r.value).filter(Boolean) as string[];
}
