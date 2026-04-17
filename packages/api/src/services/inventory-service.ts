import { eq, and, sql, inArray, isNull, gt } from 'drizzle-orm';
import { otcgs, inventoryItem, inventoryItemStock } from '../db/otcgs/index';
import { product, group, category, productExtendedData, price } from '../db/tcg-data/schema';
import { logTransaction } from './transaction-log-service';
import { likeEscaped } from '../lib/sql-utils';
import { formatDate, todayDateString, isValidDateString } from '../lib/date-utils';
import type { CardCondition } from '../schema/types.generated';
import type {
  InventoryItem,
  InventoryPage,
  InventoryItemStock as InventoryItemStockGql,
  InventoryStockPage,
  InventoryFilters,
  PaginationInput,
  AddInventoryItemInput,
  UpdateInventoryItemInput,
  AddStockInput,
  UpdateStockInput,
  BulkUpdateStockInput,
  ProductSearchResult,
} from '../schema/types.generated';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Condition to filter out soft-deleted stock entries */
function stockNotDeleted() {
  return isNull(inventoryItemStock.deletedAt);
}

function validateAddInput(input: AddInventoryItemInput): void {
  if (!input.productId) throw new Error('productId is required');
  if (!input.condition) throw new Error('condition is required');
  if (input.quantity == null || input.quantity < 1) throw new Error('quantity is required and must be at least 1');
  if (input.price == null) throw new Error('price is required');
  if (input.price < 0) throw new Error('price must be non-negative');
  if (input.costBasis == null) throw new Error('costBasis is required');
  if (input.costBasis < 0) throw new Error('costBasis must be non-negative');
  if (!input.acquisitionDate) throw new Error('acquisitionDate is required');
  if (!isValidDateString(input.acquisitionDate)) {
    throw new Error('acquisitionDate must be a valid date in YYYY-MM-DD format');
  }

  const validConditions = ['NM', 'LP', 'MP', 'HP', 'D'];
  if (!validConditions.includes(input.condition)) {
    throw new Error(`Invalid condition: ${input.condition}. Must be one of: ${validConditions.join(', ')}`);
  }
}

function validateUpdateInput(input: UpdateInventoryItemInput): void {
  if (!input.id) throw new Error('id is required');

  if (input.condition != null) {
    const validConditions = ['NM', 'LP', 'MP', 'HP', 'D'];
    if (!validConditions.includes(input.condition)) {
      throw new Error(`Invalid condition: ${input.condition}. Must be one of: ${validConditions.join(', ')}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Shared filter conditions builder
// ---------------------------------------------------------------------------

function buildFilterConditions(organizationId: string, filters?: InventoryFilters | null) {
  const conditions: ReturnType<typeof eq>[] = [];

  // Always scope to organization
  conditions.push(eq(inventoryItem.organizationId, organizationId));

  if (filters?.gameName) {
    conditions.push(likeEscaped(category.seoCategoryName, filters.gameName.toLowerCase(), 'startsWith'));
  }
  if (filters?.setName) {
    conditions.push(eq(group.name, filters.setName));
  }
  if (filters?.condition) {
    conditions.push(eq(inventoryItem.condition, filters.condition));
  }
  if (filters?.searchTerm) {
    conditions.push(likeEscaped(product.name, filters.searchTerm));
  }
  if (filters?.rarity) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND ${productExtendedData.name} = 'Rarity'
          AND ${productExtendedData.value} = ${filters.rarity}
      )`,
    );
  }

  // Product type filtering (singles vs sealed)
  const includeSingles = filters?.includeSingles;
  const includeSealed = filters?.includeSealed;

  if (includeSingles === true && includeSealed !== true) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
      )`,
    );
  } else if (includeSealed === true && includeSingles !== true) {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
      )`,
    );
  }

  return conditions;
}

// ---------------------------------------------------------------------------
// 1. getInventoryItems — One row per (productId + condition) with derived totals
// ---------------------------------------------------------------------------

export async function getInventoryItems(
  organizationId: string,
  filters?: InventoryFilters | null,
  pagination?: PaginationInput | null,
): Promise<InventoryPage> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions = buildFilterConditions(organizationId, filters);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Main query: inventory_item LEFT JOIN stock for totals
  const dataQuery = otcgs
    .select({
      id: inventoryItem.id,
      organizationId: inventoryItem.organizationId,
      productId: inventoryItem.productId,
      productName: product.name,
      gameName: category.name,
      setName: group.name,
      condition: inventoryItem.condition,
      price: inventoryItem.price,
      createdAt: inventoryItem.createdAt,
      updatedAt: inventoryItem.updatedAt,
      totalQuantity:
        sql<number>`COALESCE(SUM(CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END), 0)`.as(
          'total_quantity',
        ),
      entryCount:
        sql<number>`COALESCE(SUM(CASE WHEN ${inventoryItemStock.deletedAt} IS NULL AND ${inventoryItemStock.quantity} > 0 THEN 1 ELSE 0 END), 0)`.as(
          'entry_count',
        ),
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
    .from(inventoryItem)
    .innerJoin(product, eq(inventoryItem.productId, product.id))
    .leftJoin(group, eq(product.groupId, group.id))
    .leftJoin(category, eq(product.categoryId, category.id))
    .leftJoin(inventoryItemStock, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
    .where(whereClause)
    .groupBy(inventoryItem.id)
    .having(
      sql`COALESCE(SUM(CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END), 0) > 0`,
    );

  // Count query
  const countQuery = otcgs.select({ total: sql<number>`count(*)` }).from(
    sql`(
        SELECT ${inventoryItem.id}
        FROM ${inventoryItem}
        INNER JOIN ${product} ON ${inventoryItem.productId} = ${product.id}
        LEFT JOIN ${group} ON ${product.groupId} = ${group.id}
        LEFT JOIN ${category} ON ${product.categoryId} = ${category.id}
        LEFT JOIN ${inventoryItemStock} ON ${inventoryItemStock.inventoryItemId} = ${inventoryItem.id}
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
        GROUP BY ${inventoryItem.id}
        HAVING COALESCE(SUM(CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END), 0) > 0
      ) AS counted`,
  );

  const [countResult] = await countQuery;
  const totalCount = Number(countResult?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const rows = await dataQuery.limit(pageSize).offset(offset);

  const items: InventoryItem[] = rows.map((r) => {
    const isSingle = Boolean(r.isSingle);
    return {
      id: r.id,
      organizationId: r.organizationId,
      productId: r.productId,
      productName: r.productName ?? '',
      gameName: r.gameName ?? '',
      setName: r.setName ?? '',
      rarity: r.rarity ?? null,
      isSingle,
      isSealed: !isSingle,
      condition: r.condition as CardCondition,
      price: r.price,
      totalQuantity: r.totalQuantity,
      entryCount: r.entryCount,
      createdAt: formatDate(r.createdAt) ?? new Date().toISOString(),
      updatedAt: formatDate(r.updatedAt) ?? new Date().toISOString(),
    };
  });

  return { items, totalCount, page, pageSize, totalPages };
}

// ---------------------------------------------------------------------------
// 1b. getInventoryItemDetails — Stock entries for a parent inventory_item
// ---------------------------------------------------------------------------

export async function getInventoryItemDetails(
  organizationId: string,
  inventoryItemId: number,
  pagination?: PaginationInput | null,
): Promise<InventoryStockPage> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  // Verify parent exists and belongs to org
  const [parent] = await otcgs
    .select({ id: inventoryItem.id })
    .from(inventoryItem)
    .where(and(eq(inventoryItem.id, inventoryItemId), eq(inventoryItem.organizationId, organizationId)))
    .limit(1);

  if (!parent) {
    return { items: [], totalCount: 0, page, pageSize, totalPages: 1 };
  }

  const stockConditions = [
    eq(inventoryItemStock.inventoryItemId, inventoryItemId),
    stockNotDeleted(),
    gt(inventoryItemStock.quantity, 0),
  ];
  const whereClause = and(...stockConditions);

  // Count
  const [countResult] = await otcgs
    .select({ total: sql<number>`count(*)` })
    .from(inventoryItemStock)
    .where(whereClause);

  const totalCount = Number(countResult?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Data
  const rows = await otcgs
    .select()
    .from(inventoryItemStock)
    .where(whereClause)
    .orderBy(inventoryItemStock.createdAt)
    .limit(pageSize)
    .offset(offset);

  const items: InventoryItemStockGql[] = rows.map((r) => ({
    id: r.id,
    inventoryItemId: r.inventoryItemId,
    quantity: r.quantity,
    costBasis: r.costBasis,
    acquisitionDate: r.acquisitionDate,
    notes: r.notes ?? null,
    createdAt: formatDate(r.createdAt) ?? new Date().toISOString(),
    updatedAt: formatDate(r.updatedAt) ?? new Date().toISOString(),
  }));

  return { items, totalCount, page, pageSize, totalPages };
}

// ---------------------------------------------------------------------------
// 2. getInventoryItemById — Returns a parent InventoryItem with derived qty
// ---------------------------------------------------------------------------

export async function getInventoryItemById(id: number, organizationId: string): Promise<InventoryItem | null> {
  const rows = await otcgs
    .select({
      id: inventoryItem.id,
      organizationId: inventoryItem.organizationId,
      productId: inventoryItem.productId,
      productName: product.name,
      gameName: category.name,
      setName: group.name,
      condition: inventoryItem.condition,
      price: inventoryItem.price,
      createdAt: inventoryItem.createdAt,
      updatedAt: inventoryItem.updatedAt,
      totalQuantity:
        sql<number>`COALESCE(SUM(CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END), 0)`.as(
          'total_quantity',
        ),
      entryCount:
        sql<number>`COALESCE(SUM(CASE WHEN ${inventoryItemStock.deletedAt} IS NULL AND ${inventoryItemStock.quantity} > 0 THEN 1 ELSE 0 END), 0)`.as(
          'entry_count',
        ),
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
    .from(inventoryItem)
    .innerJoin(product, eq(inventoryItem.productId, product.id))
    .leftJoin(group, eq(product.groupId, group.id))
    .leftJoin(category, eq(product.categoryId, category.id))
    .leftJoin(inventoryItemStock, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
    .where(and(eq(inventoryItem.id, id), eq(inventoryItem.organizationId, organizationId)))
    .groupBy(inventoryItem.id)
    .limit(1);

  if (rows.length === 0) return null;

  const r = rows[0];
  const isSingle = Boolean(r.isSingle);

  return {
    id: r.id,
    organizationId: r.organizationId,
    productId: r.productId,
    productName: r.productName ?? '',
    gameName: r.gameName ?? '',
    setName: r.setName ?? '',
    rarity: r.rarity ?? null,
    isSingle,
    isSealed: !isSingle,
    condition: r.condition as CardCondition,
    price: r.price,
    totalQuantity: r.totalQuantity,
    entryCount: r.entryCount,
    createdAt: formatDate(r.createdAt) ?? new Date().toISOString(),
    updatedAt: formatDate(r.updatedAt) ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 3. addInventoryItem — Find/create parent + create stock entry
// ---------------------------------------------------------------------------

export async function addInventoryItem(
  organizationId: string,
  input: AddInventoryItemInput,
  userId: string,
): Promise<InventoryItem> {
  validateAddInput(input);

  const now = new Date();

  // Wrap find-or-create in a transaction to prevent concurrent calls from
  // creating duplicate parent inventory items for the same (org, product, condition).
  const parentId = await otcgs.transaction(async (tx) => {
    // Find or create parent inventory_item (parents are never deleted)
    const [existingParent] = await tx
      .select()
      .from(inventoryItem)
      .where(
        and(
          eq(inventoryItem.organizationId, organizationId),
          eq(inventoryItem.productId, input.productId),
          eq(inventoryItem.condition, input.condition),
        ),
      )
      .limit(1);

    let parentId: number;

    if (existingParent) {
      // Update price on existing parent
      parentId = existingParent.id;
      await tx
        .update(inventoryItem)
        .set({ price: input.price, updatedBy: userId, updatedAt: now })
        .where(eq(inventoryItem.id, parentId));
    } else {
      // Create new parent
      const [inserted] = await tx
        .insert(inventoryItem)
        .values({
          organizationId,
          productId: input.productId,
          condition: input.condition,
          price: input.price,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      parentId = inserted.id;
    }

    // Check for duplicate stock entry (same costBasis + acquisitionDate).
    // Search ALL entries including soft-deleted ones — the unique index spans
    // deleted rows too, so we must reuse an existing row rather than inserting.
    const [existingStock] = await tx
      .select()
      .from(inventoryItemStock)
      .where(
        and(
          eq(inventoryItemStock.inventoryItemId, parentId),
          eq(inventoryItemStock.costBasis, input.costBasis),
          eq(inventoryItemStock.acquisitionDate, input.acquisitionDate),
        ),
      )
      .limit(1);

    if (existingStock) {
      // Reuse: un-delete if needed, add quantity
      const baseQty = existingStock.deletedAt ? 0 : existingStock.quantity;
      await tx
        .update(inventoryItemStock)
        .set({
          quantity: baseQty + input.quantity,
          notes: input.notes ?? existingStock.notes,
          deletedAt: null,
          updatedBy: userId,
          updatedAt: now,
        })
        .where(eq(inventoryItemStock.id, existingStock.id));
    } else {
      // Create new stock entry
      await tx.insert(inventoryItemStock).values({
        inventoryItemId: parentId,
        quantity: input.quantity,
        costBasis: input.costBasis,
        acquisitionDate: input.acquisitionDate,
        notes: input.notes ?? null,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return parentId;
  });

  // Log the transaction (outside DB transaction — best-effort)
  await logTransaction({
    organizationId,
    userId,
    action: 'inventory.item_created',
    resourceType: 'inventory',
    resourceId: parentId,
    details: {
      productId: input.productId,
      condition: input.condition,
      price: input.price,
      quantity: input.quantity,
      costBasis: input.costBasis,
    },
  });

  const result = await getInventoryItemById(parentId, organizationId);
  if (!result) throw new Error(`Failed to retrieve inventory item after creation (id: ${parentId})`);
  return result;
}

// ---------------------------------------------------------------------------
// 4. updateInventoryItem — Update parent price/condition
// ---------------------------------------------------------------------------

export async function updateInventoryItem(
  input: UpdateInventoryItemInput,
  userId: string,
  organizationId: string,
): Promise<InventoryItem> {
  validateUpdateInput(input);
  const now = new Date();

  // Wrap in transaction to prevent concurrent condition changes from losing stock
  const resultInfo = await otcgs.transaction(async (tx) => {
    // If condition is changing, we may need to merge parents
    if (input.condition != null) {
      const [currentItem] = await tx
        .select()
        .from(inventoryItem)
        .where(and(eq(inventoryItem.id, input.id), eq(inventoryItem.organizationId, organizationId)))
        .limit(1);

      if (!currentItem) throw new Error('Inventory item not found');

      if (input.condition !== currentItem.condition) {
        // Check if a parent already exists for the target (productId, newCondition)
        const [existingTarget] = await tx
          .select()
          .from(inventoryItem)
          .where(
            and(
              eq(inventoryItem.organizationId, currentItem.organizationId),
              eq(inventoryItem.productId, currentItem.productId),
              eq(inventoryItem.condition, input.condition),
            ),
          )
          .limit(1);

        if (existingTarget) {
          // Merge: move all stock entries from current parent to existing target
          await tx
            .update(inventoryItemStock)
            .set({ inventoryItemId: existingTarget.id, updatedBy: userId, updatedAt: now })
            .where(and(eq(inventoryItemStock.inventoryItemId, currentItem.id), stockNotDeleted()));

          // Update price on surviving parent if provided
          if (input.price != null) {
            await tx
              .update(inventoryItem)
              .set({ price: input.price, updatedBy: userId, updatedAt: now })
              .where(eq(inventoryItem.id, existingTarget.id));
          }

          // Merge any duplicate stock entries (same costBasis + acquisitionDate) that now exist
          await mergeStockDuplicates(tx, existingTarget.id, userId);

          return { merged: true, targetId: existingTarget.id, currentItem };
        }
      }
    }

    // No merge needed — simple update of parent fields
    const updates: Record<string, unknown> = { updatedBy: userId, updatedAt: now };
    if (input.condition != null) updates.condition = input.condition;
    if (input.price != null) updates.price = input.price;

    await tx
      .update(inventoryItem)
      .set(updates)
      .where(and(eq(inventoryItem.id, input.id), eq(inventoryItem.organizationId, organizationId)));

    return { merged: false, targetId: input.id };
  });

  // Log the transaction (outside DB transaction — best-effort)
  if (resultInfo.merged && resultInfo.currentItem) {
    await logTransaction({
      organizationId,
      userId,
      action: 'inventory.item_updated',
      resourceType: 'inventory',
      resourceId: resultInfo.targetId,
      details: {
        productId: resultInfo.currentItem.productId,
        conditionBefore: resultInfo.currentItem.condition,
        conditionAfter: input.condition,
        priceBefore: resultInfo.currentItem.price,
        priceAfter: input.price ?? resultInfo.currentItem.price,
        merged: true,
      },
    });
  } else {
    await logTransaction({
      organizationId,
      userId,
      action: 'inventory.item_updated',
      resourceType: 'inventory',
      resourceId: input.id,
      details: {
        condition: input.condition ?? undefined,
        price: input.price ?? undefined,
      },
    });
  }

  const result = await getInventoryItemById(resultInfo.targetId, organizationId);
  if (!result) throw new Error(`Failed to retrieve inventory item after update (id: ${resultInfo.targetId})`);
  return result;
}

// ---------------------------------------------------------------------------
// 5. deleteInventoryItem — Soft-delete all stock (parent stays; hidden when no stock)
// ---------------------------------------------------------------------------

export async function deleteInventoryItem(id: number, organizationId: string, userId: string): Promise<boolean> {
  const now = new Date();

  // Verify the inventory item belongs to this organization
  const [item] = await otcgs
    .select({ id: inventoryItem.id })
    .from(inventoryItem)
    .where(and(eq(inventoryItem.id, id), eq(inventoryItem.organizationId, organizationId)))
    .limit(1);

  if (!item) throw new Error('Inventory item not found');

  // Soft-delete all non-deleted stock entries for this parent.
  // The parent row itself is never deleted — it will be hidden from the
  // list view automatically because the HAVING clause filters out items
  // with zero total stock.
  await otcgs
    .update(inventoryItemStock)
    .set({ deletedAt: now, quantity: 0, updatedAt: now })
    .where(and(eq(inventoryItemStock.inventoryItemId, id), stockNotDeleted()));

  // Log the transaction
  await logTransaction({
    organizationId,
    userId,
    action: 'inventory.item_deleted',
    resourceType: 'inventory',
    resourceId: id,
    details: { inventoryItemId: id },
  });

  return true;
}

// ---------------------------------------------------------------------------
// 6. Stock CRUD operations
// ---------------------------------------------------------------------------

export async function addStock(
  input: AddStockInput,
  userId: string,
  organizationId: string,
): Promise<InventoryItemStockGql> {
  const now = new Date();

  // Wrap in transaction to prevent duplicate stock entries from concurrent calls
  const resultStockId = await otcgs.transaction(async (tx) => {
    // Verify parent exists and belongs to this organization
    const [parent] = await tx
      .select({ id: inventoryItem.id })
      .from(inventoryItem)
      .where(and(eq(inventoryItem.id, input.inventoryItemId), eq(inventoryItem.organizationId, organizationId)))
      .limit(1);

    if (!parent) throw new Error('Inventory item not found');

    // Check for duplicate stock entry (same costBasis + acquisitionDate).
    // Search ALL entries including soft-deleted ones — the unique index spans
    // deleted rows too, so we must reuse an existing row rather than inserting.
    const [existing] = await tx
      .select()
      .from(inventoryItemStock)
      .where(
        and(
          eq(inventoryItemStock.inventoryItemId, input.inventoryItemId),
          eq(inventoryItemStock.costBasis, input.costBasis),
          eq(inventoryItemStock.acquisitionDate, input.acquisitionDate),
        ),
      )
      .limit(1);

    if (existing) {
      // Reuse: un-delete if needed, add quantity
      const baseQty = existing.deletedAt ? 0 : existing.quantity;
      await tx
        .update(inventoryItemStock)
        .set({
          quantity: baseQty + input.quantity,
          notes: input.notes ?? existing.notes,
          deletedAt: null,
          updatedBy: userId,
          updatedAt: now,
        })
        .where(eq(inventoryItemStock.id, existing.id));

      return existing.id;
    } else {
      // Insert new stock entry
      const [inserted] = await tx
        .insert(inventoryItemStock)
        .values({
          inventoryItemId: input.inventoryItemId,
          quantity: input.quantity,
          costBasis: input.costBasis,
          acquisitionDate: input.acquisitionDate,
          notes: input.notes ?? null,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return inserted.id;
    }
  });

  // Log the transaction (outside DB transaction — best-effort)
  await logTransaction({
    organizationId,
    userId,
    action: 'inventory.stock_added',
    resourceType: 'inventory',
    resourceId: resultStockId,
    details: {
      inventoryItemId: input.inventoryItemId,
      quantity: input.quantity,
      costBasis: input.costBasis,
      acquisitionDate: input.acquisitionDate,
    },
  });

  const result = await getStockById(resultStockId);
  if (!result) throw new Error(`Failed to retrieve stock entry after creation (id: ${resultStockId})`);
  return result;
}

export async function updateStock(
  input: UpdateStockInput,
  userId: string,
  organizationId: string,
): Promise<InventoryItemStockGql> {
  const now = new Date();

  if (input.quantity != null && input.quantity < 0) {
    throw new Error('quantity must be non-negative');
  }

  // Wrap in transaction to prevent concurrent updates from corrupting quantities during merge
  const txResult = await otcgs.transaction(async (tx) => {
    // Fetch current stock entry and verify it belongs to this organization
    const [current] = await tx
      .select({
        id: inventoryItemStock.id,
        inventoryItemId: inventoryItemStock.inventoryItemId,
        quantity: inventoryItemStock.quantity,
        costBasis: inventoryItemStock.costBasis,
        acquisitionDate: inventoryItemStock.acquisitionDate,
        notes: inventoryItemStock.notes,
        deletedAt: inventoryItemStock.deletedAt,
        createdBy: inventoryItemStock.createdBy,
        updatedBy: inventoryItemStock.updatedBy,
        createdAt: inventoryItemStock.createdAt,
        updatedAt: inventoryItemStock.updatedAt,
      })
      .from(inventoryItemStock)
      .innerJoin(inventoryItem, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
      .where(
        and(eq(inventoryItemStock.id, input.id), eq(inventoryItem.organizationId, organizationId), stockNotDeleted()),
      )
      .limit(1);

    if (!current) throw new Error('Stock entry not found');

    // Check if costBasis or acquisitionDate are changing — may need to merge
    const changingCostBasis = input.costBasis !== undefined && input.costBasis !== null;
    const changingAcqDate = input.acquisitionDate !== undefined && input.acquisitionDate !== null;

    if (changingCostBasis || changingAcqDate) {
      const effectiveCostBasis = changingCostBasis ? input.costBasis! : current.costBasis;
      const effectiveAcqDate = changingAcqDate ? input.acquisitionDate! : current.acquisitionDate;

      // Check for a duplicate (including soft-deleted — unique index covers all rows)
      const [duplicate] = await tx
        .select()
        .from(inventoryItemStock)
        .where(
          and(
            eq(inventoryItemStock.inventoryItemId, current.inventoryItemId),
            eq(inventoryItemStock.costBasis, effectiveCostBasis),
            eq(inventoryItemStock.acquisitionDate, effectiveAcqDate),
          ),
        )
        .limit(1);

      if (duplicate && duplicate.id !== input.id) {
        // Merge into the duplicate (un-delete if it was soft-deleted)
        const effectiveQty = input.quantity ?? current.quantity;
        const baseQty = duplicate.deletedAt ? 0 : duplicate.quantity;
        await tx
          .update(inventoryItemStock)
          .set({
            quantity: baseQty + effectiveQty,
            notes: input.notes !== undefined ? (input.notes ?? null) : duplicate.notes,
            deletedAt: null,
            updatedBy: userId,
            updatedAt: now,
          })
          .where(eq(inventoryItemStock.id, duplicate.id));

        // Soft-delete the original
        await tx
          .update(inventoryItemStock)
          .set({ deletedAt: now, quantity: 0, updatedBy: userId, updatedAt: now })
          .where(eq(inventoryItemStock.id, input.id));

        return { resultStockId: duplicate.id, merged: true };
      }
    }

    // No merge — simple update. Preserve null costBasis as null (don't coerce to 0).
    const updates: Record<string, unknown> = { updatedBy: userId, updatedAt: now };
    if (input.quantity != null) updates.quantity = input.quantity;
    if (input.costBasis !== undefined) updates.costBasis = input.costBasis;
    if (input.acquisitionDate !== undefined) updates.acquisitionDate = input.acquisitionDate || todayDateString();
    if (input.notes !== undefined) updates.notes = input.notes ?? null;

    await tx.update(inventoryItemStock).set(updates).where(eq(inventoryItemStock.id, input.id));

    return { resultStockId: input.id, merged: false };
  });

  // Log the transaction (outside DB transaction — best-effort)
  await logTransaction({
    organizationId,
    userId,
    action: 'inventory.stock_updated',
    resourceType: 'inventory',
    resourceId: txResult.resultStockId,
    details: txResult.merged
      ? { stockId: input.id, mergedInto: txResult.resultStockId, quantity: input.quantity }
      : { stockId: input.id, quantity: input.quantity ?? undefined, costBasis: input.costBasis ?? undefined },
  });

  const result = await getStockById(txResult.resultStockId);
  if (!result) throw new Error(`Failed to retrieve stock entry after update (id: ${txResult.resultStockId})`);
  return result;
}

export async function deleteStock(id: number, organizationId: string, userId: string): Promise<boolean> {
  const now = new Date();

  // Verify the stock entry belongs to this organization
  const [stockEntry] = await otcgs
    .select({ id: inventoryItemStock.id })
    .from(inventoryItemStock)
    .innerJoin(inventoryItem, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
    .where(and(eq(inventoryItemStock.id, id), eq(inventoryItem.organizationId, organizationId)))
    .limit(1);

  if (!stockEntry) throw new Error('Stock entry not found');

  await otcgs
    .update(inventoryItemStock)
    .set({ deletedAt: now, quantity: 0, updatedAt: now })
    .where(eq(inventoryItemStock.id, id));

  // Log the transaction
  await logTransaction({
    organizationId,
    userId,
    action: 'inventory.stock_deleted',
    resourceType: 'inventory',
    resourceId: id,
    details: { stockId: id },
  });

  return true;
}

// ---------------------------------------------------------------------------
// 7. Bulk stock operations
// ---------------------------------------------------------------------------

export async function bulkUpdateStock(
  input: BulkUpdateStockInput,
  userId: string,
  organizationId: string,
): Promise<InventoryItemStockGql[]> {
  const now = new Date();

  const changingCostBasis = input.costBasis !== undefined && input.costBasis !== null;
  const changingAcqDate = input.acquisitionDate !== undefined && input.acquisitionDate !== null;

  // If changing unique-key fields, process one at a time (merge logic).
  // Each individual updateStock call is already wrapped in a transaction.
  if (changingCostBasis || changingAcqDate) {
    const results: InventoryItemStockGql[] = [];
    for (const id of input.ids) {
      const result = await updateStock(
        {
          id,
          quantity: input.quantity ?? undefined,
          costBasis: input.costBasis ?? undefined,
          acquisitionDate: input.acquisitionDate ?? undefined,
          notes: input.notes ?? undefined,
        },
        userId,
        organizationId,
      );
      results.push(result);
    }
    return results;
  }

  // Wrap simple bulk update in a transaction for true all-or-nothing guarantee
  const { validIds, rows } = await otcgs.transaction(async (tx) => {
    const updates: Record<string, unknown> = { updatedBy: userId, updatedAt: now };
    if (input.quantity != null) updates.quantity = input.quantity;
    if (input.notes !== undefined) updates.notes = input.notes ?? null;

    // Verify all stock entries belong to this organization before updating
    const validStockIds = await tx
      .select({ id: inventoryItemStock.id })
      .from(inventoryItemStock)
      .innerJoin(inventoryItem, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
      .where(and(inArray(inventoryItemStock.id, input.ids), eq(inventoryItem.organizationId, organizationId)));

    const validIds = validStockIds.map((r) => r.id);
    if (validIds.length !== input.ids.length) {
      throw new Error('One or more stock entries not found or do not belong to this organization');
    }

    await tx.update(inventoryItemStock).set(updates).where(inArray(inventoryItemStock.id, validIds));

    // Fetch updated stock entries
    const rows = await tx
      .select()
      .from(inventoryItemStock)
      .where(and(inArray(inventoryItemStock.id, validIds), stockNotDeleted()));

    return { validIds, rows };
  });

  // Log the transaction (outside DB transaction — best-effort)
  await logTransaction({
    organizationId,
    userId,
    action: 'inventory.stock_bulk_updated',
    resourceType: 'inventory',
    details: {
      count: validIds.length,
      ids: validIds,
      quantity: input.quantity ?? undefined,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    inventoryItemId: r.inventoryItemId,
    quantity: r.quantity,
    costBasis: r.costBasis,
    acquisitionDate: r.acquisitionDate,
    notes: r.notes ?? null,
    createdAt: formatDate(r.createdAt) ?? new Date().toISOString(),
    updatedAt: formatDate(r.updatedAt) ?? new Date().toISOString(),
  }));
}

export async function bulkDeleteStock(ids: number[], organizationId: string, userId: string): Promise<boolean> {
  const now = new Date();

  // Wrap in transaction for true all-or-nothing guarantee
  const validIds = await otcgs.transaction(async (tx) => {
    // Verify all stock entries belong to this organization before deleting
    const validStockIds = await tx
      .select({ id: inventoryItemStock.id })
      .from(inventoryItemStock)
      .innerJoin(inventoryItem, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
      .where(and(inArray(inventoryItemStock.id, ids), eq(inventoryItem.organizationId, organizationId)));

    const validIds = validStockIds.map((r) => r.id);
    if (validIds.length !== ids.length) {
      throw new Error('One or more stock entries not found or do not belong to this organization');
    }

    await tx
      .update(inventoryItemStock)
      .set({ deletedAt: now, quantity: 0, updatedAt: now })
      .where(inArray(inventoryItemStock.id, validIds));

    return validIds;
  });

  // Log the transaction (outside DB transaction — best-effort)
  await logTransaction({
    organizationId,
    userId,
    action: 'inventory.stock_bulk_deleted',
    resourceType: 'inventory',
    details: { count: validIds.length, ids: validIds },
  });

  return true;
}

// ---------------------------------------------------------------------------
// 8. Internal helpers
// ---------------------------------------------------------------------------

async function getStockById(id: number): Promise<InventoryItemStockGql | null> {
  const [row] = await otcgs.select().from(inventoryItemStock).where(eq(inventoryItemStock.id, id)).limit(1);

  if (!row) return null;
  return {
    id: row.id,
    inventoryItemId: row.inventoryItemId,
    quantity: row.quantity,
    costBasis: row.costBasis,
    acquisitionDate: row.acquisitionDate,
    notes: row.notes ?? null,
    createdAt: formatDate(row.createdAt) ?? new Date().toISOString(),
    updatedAt: formatDate(row.updatedAt) ?? new Date().toISOString(),
  };
}

type TxHandle = Parameters<Parameters<typeof otcgs.transaction>[0]>[0];

/**
 * After moving stock entries between parents, merge any duplicates
 * (same costBasis + acquisitionDate) within a single parent.
 * Accepts a transaction handle to run within the caller's transaction.
 */
async function mergeStockDuplicates(
  db: TxHandle | typeof otcgs,
  parentId: number,
  userId: string,
): Promise<void> {
  const now = new Date();
  // Fetch ALL stock entries (including soft-deleted) because the unique
  // index covers all rows regardless of deletedAt.
  const stocks = await db.select().from(inventoryItemStock).where(eq(inventoryItemStock.inventoryItemId, parentId));

  // Group by costBasis + acquisitionDate
  const groups = new Map<string, (typeof stocks)[number][]>();
  for (const s of stocks) {
    const key = `${s.costBasis}\0${s.acquisitionDate}`;
    const existing = groups.get(key) ?? [];
    existing.push(s);
    groups.set(key, existing);
  }

  for (const entries of groups.values()) {
    if (entries.length <= 1) continue;

    // Keep the first non-deleted entry (or just the first if all deleted), merge the rest
    const nonDeleted = entries.filter((e) => !e.deletedAt);
    const [survivor, ...toMerge] =
      nonDeleted.length > 0 ? [nonDeleted[0], ...entries.filter((e) => e.id !== nonDeleted[0].id)] : entries;
    let totalQty = survivor.deletedAt ? 0 : survivor.quantity;
    for (const entry of toMerge) {
      if (!entry.deletedAt) totalQty += entry.quantity;
    }

    await db
      .update(inventoryItemStock)
      .set({ quantity: totalQty, deletedAt: null, updatedBy: userId, updatedAt: now })
      .where(eq(inventoryItemStock.id, survivor.id));

    const idsToDelete = toMerge.map((e) => e.id);
    if (idsToDelete.length > 0) {
      await db
        .update(inventoryItemStock)
        .set({ deletedAt: now, quantity: 0, updatedBy: userId, updatedAt: now })
        .where(inArray(inventoryItemStock.id, idsToDelete));
    }
  }
}

// ---------------------------------------------------------------------------
// 9. searchProducts — unchanged (queries product table, not inventory)
// ---------------------------------------------------------------------------

export async function searchProducts(
  searchTerm: string,
  game?: string | null,
  isSingle?: boolean | null,
  isSealed?: boolean | null,
): Promise<ProductSearchResult[]> {
  const conditions: ReturnType<typeof eq>[] = [likeEscaped(product.name, searchTerm)];

  if (game) {
    conditions.push(likeEscaped(category.seoCategoryName, game.toLowerCase(), 'startsWith'));
  }

  // Filter by product type (singles have Rarity or Number extended data; sealed do not)
  if (isSingle === true) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
      )`,
    );
  } else if (isSealed === true) {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
      )`,
    );
  }

  const rows = await otcgs
    .select({
      id: product.id,
      name: product.name,
      gameName: category.name,
      setName: group.name,
      imageUrl: product.imageUrl,
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
    .from(product)
    .leftJoin(group, eq(product.groupId, group.id))
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(and(...conditions))
    .limit(50);

  // Fetch prices for all matched products in one query
  const productIds = rows.map((r) => r.id);
  const priceRows =
    productIds.length > 0
      ? await otcgs
          .select({
            productId: price.productId,
            subTypeName: price.subTypeName,
            lowPrice: price.lowPrice,
            midPrice: price.midPrice,
            highPrice: price.highPrice,
            marketPrice: price.marketPrice,
            directLowPrice: price.directLowPrice,
          })
          .from(price)
          .where(inArray(price.productId, productIds))
      : [];

  // Group prices by productId
  const pricesByProductId = new Map<number, typeof priceRows>();
  for (const pr of priceRows) {
    if (pr.productId == null) continue;
    const existing = pricesByProductId.get(pr.productId) ?? [];
    existing.push(pr);
    pricesByProductId.set(pr.productId, existing);
  }

  return rows.map((r) => {
    const isSingle = Boolean(r.isSingle);
    const productPrices = pricesByProductId.get(r.id) ?? [];

    return {
      id: r.id,
      name: r.name ?? '',
      gameName: r.gameName ?? '',
      setName: r.setName ?? '',
      rarity: r.rarity ?? null,
      imageUrl: r.imageUrl ?? null,
      isSingle,
      isSealed: !isSingle,
      prices: productPrices.map((p) => ({
        subTypeName: p.subTypeName,
        lowPrice: p.lowPrice ?? null,
        midPrice: p.midPrice ?? null,
        highPrice: p.highPrice ?? null,
        marketPrice: p.marketPrice ?? null,
        directLowPrice: p.directLowPrice ?? null,
      })),
    };
  });
}
