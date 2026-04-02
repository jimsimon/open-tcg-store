import { eq, and, like, sql, inArray, isNull, gt } from 'drizzle-orm';
import { otcgs, inventoryItem } from '../db/otcgs/index';
import { product, group, category, productExtendedData, price } from '../db/tcg-data/schema';
import type {
  InventoryItem,
  InventoryPage,
  InventoryFilters,
  PaginationInput,
  AddInventoryItemInput,
  UpdateInventoryItemInput,
  BulkUpdateInventoryInput,
  ProductSearchResult,
  GroupedInventoryItem,
  GroupedInventoryPage,
} from '../schema/types.generated';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/** Return today's date as YYYY-MM-DD. */
function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Condition to filter out soft-deleted items */
function notDeleted() {
  return isNull(inventoryItem.deletedAt);
}

/** Condition to filter out items with zero quantity */
function hasQuantity() {
  return gt(inventoryItem.quantity, 0);
}

/**
 * Validate required fields for add/update operations.
 * All fields except "notes" should be required when adding.
 */
function validateAddInput(input: AddInventoryItemInput): void {
  if (!input.productId) throw new Error('productId is required');
  if (!input.condition) throw new Error('condition is required');
  if (input.quantity == null || input.quantity < 1) throw new Error('quantity is required and must be at least 1');
  if (input.price == null) throw new Error('price is required');
  if (input.costBasis == null) throw new Error('costBasis is required');
  if (!input.acquisitionDate) throw new Error('acquisitionDate is required');

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
  if (input.quantity != null && input.quantity < 0) {
    throw new Error('quantity must be non-negative');
  }
}

/**
 * Build the base SELECT + JOINs used by both list and single-item queries.
 * Returns a query builder that can be further filtered / paginated.
 */
function baseInventoryQuery() {
  return otcgs
    .select({
      id: inventoryItem.id,
      organizationId: inventoryItem.organizationId,
      productId: inventoryItem.productId,
      productName: product.name,
      gameName: category.name,
      setName: group.name,
      condition: inventoryItem.condition,
      quantity: inventoryItem.quantity,
      price: inventoryItem.price,
      costBasis: inventoryItem.costBasis,
      acquisitionDate: inventoryItem.acquisitionDate,
      notes: inventoryItem.notes,
      createdAt: inventoryItem.createdAt,
      updatedAt: inventoryItem.updatedAt,
      // Rarity from extended data
      rarity: sql<string | null>`(
        SELECT ${productExtendedData.value}
        FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND ${productExtendedData.name} = 'Rarity'
        LIMIT 1
      )`.as('rarity'),
      // isSingle flag
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
    .leftJoin(category, eq(product.categoryId, category.id));
}

/** Map a raw row from baseInventoryQuery into the GraphQL InventoryItem shape. */
function mapRow(row: Record<string, unknown>): InventoryItem {
  const r = row as {
    id: number;
    organizationId: string;
    productId: number;
    productName: string;
    gameName: string | null;
    setName: string | null;
    condition: string;
    quantity: number;
    price: number;
    costBasis: number;
    acquisitionDate: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    rarity: string | null;
    isSingle: boolean | number;
  };

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
    condition: r.condition,
    quantity: r.quantity,
    price: r.price,
    costBasis: r.costBasis,
    acquisitionDate: r.acquisitionDate,
    notes: r.notes ?? null,
    createdAt: formatDate(r.createdAt) ?? new Date().toISOString(),
    updatedAt: formatDate(r.updatedAt) ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Shared filter conditions builder
// ---------------------------------------------------------------------------

function buildFilterConditions(organizationId: string, filters?: InventoryFilters | null) {
  const conditions: ReturnType<typeof eq>[] = [];

  // Always scope to organization and exclude soft-deleted items
  conditions.push(eq(inventoryItem.organizationId, organizationId));
  conditions.push(notDeleted());

  if (filters?.gameName) {
    conditions.push(like(category.seoCategoryName, `${filters.gameName.toLowerCase()}%`));
  }
  if (filters?.setName) {
    conditions.push(eq(group.name, filters.setName));
  }
  if (filters?.condition) {
    conditions.push(eq(inventoryItem.condition, filters.condition));
  }
  if (filters?.searchTerm) {
    conditions.push(like(product.name, `%${filters.searchTerm}%`));
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
// 1. getInventoryItems — Returns GROUPED inventory (by productId + condition)
// ---------------------------------------------------------------------------

export async function getInventoryItems(
  organizationId: string,
  filters?: InventoryFilters | null,
  pagination?: PaginationInput | null,
): Promise<GroupedInventoryPage> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions = buildFilterConditions(organizationId, filters);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Grouped query: group by productId + condition, filter out groups with 0 total quantity
  const groupedQuery = otcgs
    .select({
      organizationId: inventoryItem.organizationId,
      productId: inventoryItem.productId,
      productName: product.name,
      gameName: category.name,
      setName: group.name,
      condition: inventoryItem.condition,
      totalQuantity: sql<number>`SUM(${inventoryItem.quantity})`.as('total_quantity'),
      lowestPrice: sql<number | null>`MIN(${inventoryItem.price})`.as('lowest_price'),
      highestPrice: sql<number | null>`MAX(${inventoryItem.price})`.as('highest_price'),
      entryCount: sql<number>`COUNT(${inventoryItem.id})`.as('entry_count'),
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
    .where(whereClause)
    .groupBy(inventoryItem.productId, inventoryItem.condition)
    .having(sql`SUM(${inventoryItem.quantity}) > 0`);

  // Count query: wrap the grouped query to count distinct groups
  const countQuery = otcgs
    .select({ total: sql<number>`count(*)` })
    .from(
      sql`(
        SELECT ${inventoryItem.productId}, ${inventoryItem.condition}
        FROM ${inventoryItem}
        INNER JOIN ${product} ON ${inventoryItem.productId} = ${product.id}
        LEFT JOIN ${group} ON ${product.groupId} = ${group.id}
        LEFT JOIN ${category} ON ${product.categoryId} = ${category.id}
        ${whereClause ? sql`WHERE ${whereClause}` : sql``}
        GROUP BY ${inventoryItem.productId}, ${inventoryItem.condition}
        HAVING SUM(${inventoryItem.quantity}) > 0
      ) AS grouped`,
    );

  const [countResult] = await countQuery;
  const totalCount = Number(countResult?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Data query with pagination
  const rows = await groupedQuery.limit(pageSize).offset(offset);

  const items: GroupedInventoryItem[] = rows.map((r) => {
    const isSingle = Boolean(r.isSingle);
    return {
      organizationId: r.organizationId,
      productId: r.productId,
      productName: r.productName ?? '',
      gameName: r.gameName ?? '',
      setName: r.setName ?? '',
      rarity: r.rarity ?? null,
      isSingle,
      isSealed: !isSingle,
      condition: r.condition,
      totalQuantity: r.totalQuantity,
      lowestPrice: r.lowestPrice ?? null,
      highestPrice: r.highestPrice ?? null,
      entryCount: r.entryCount,
    };
  });

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// 1b. getInventoryItemDetails — Returns individual entries for a product+condition
// ---------------------------------------------------------------------------

export async function getInventoryItemDetails(
  organizationId: string,
  productId: number,
  condition: string,
  pagination?: PaginationInput | null,
): Promise<InventoryPage> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(inventoryItem.organizationId, organizationId),
    eq(inventoryItem.productId, productId),
    eq(inventoryItem.condition, condition),
    notDeleted(),
    hasQuantity(),
  ];
  const whereClause = and(...conditions);

  // Count query
  const [countResult] = await otcgs
    .select({ total: sql<number>`count(*)` })
    .from(inventoryItem)
    .innerJoin(product, eq(inventoryItem.productId, product.id))
    .leftJoin(group, eq(product.groupId, group.id))
    .leftJoin(category, eq(product.categoryId, category.id))
    .where(whereClause);

  const totalCount = Number(countResult?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Data query
  const rows = await baseInventoryQuery().where(whereClause).limit(pageSize).offset(offset);

  return {
    items: rows.map((r) => mapRow(r as unknown as Record<string, unknown>)),
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

// ---------------------------------------------------------------------------
// 2. getInventoryItemById
// ---------------------------------------------------------------------------

export async function getInventoryItemById(id: number): Promise<InventoryItem | null> {
  const rows = await baseInventoryQuery()
    .where(and(eq(inventoryItem.id, id), notDeleted()))
    .limit(1);

  if (rows.length === 0) return null;
  return mapRow(rows[0] as unknown as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// 3. addInventoryItem
// ---------------------------------------------------------------------------

export async function addInventoryItem(
  organizationId: string,
  input: AddInventoryItemInput,
  userId: string,
): Promise<InventoryItem> {
  // Validate required fields
  validateAddInput(input);

  // Check for existing row with same org + productId + condition + costBasis + acquisitionDate
  const duplicateConditions = [
    eq(inventoryItem.organizationId, organizationId),
    eq(inventoryItem.productId, input.productId),
    eq(inventoryItem.condition, input.condition),
    eq(inventoryItem.costBasis, input.costBasis),
    eq(inventoryItem.acquisitionDate, input.acquisitionDate),
    notDeleted(),
  ];

  const [existing] = await otcgs
    .select()
    .from(inventoryItem)
    .where(and(...duplicateConditions))
    .limit(1);

  if (existing) {
    // Merge: add quantity, update price
    const newQuantity = existing.quantity + input.quantity;
    await otcgs
      .update(inventoryItem)
      .set({
        quantity: newQuantity,
        price: input.price,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItem.id, existing.id));

    return (await getInventoryItemById(existing.id))!;
  }

  // Insert new row
  const [inserted] = await otcgs
    .insert(inventoryItem)
    .values({
      organizationId,
      productId: input.productId,
      condition: input.condition,
      quantity: input.quantity,
      price: input.price,
      costBasis: input.costBasis,
      acquisitionDate: input.acquisitionDate,
      notes: input.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return (await getInventoryItemById(inserted.id))!;
}

// ---------------------------------------------------------------------------
// 4. updateInventoryItem
// ---------------------------------------------------------------------------

export async function updateInventoryItem(input: UpdateInventoryItemInput, userId: string): Promise<InventoryItem> {
  validateUpdateInput(input);

  const changingCondition = input.condition != null;
  const changingCostBasis = input.costBasis !== undefined;
  const changingAcquisitionDate = input.acquisitionDate !== undefined;

  // If any unique-key field is changing, check for merge with an existing row
  if (changingCondition || changingCostBasis || changingAcquisitionDate) {
    // Fetch the current item so we can compute the effective unique-key tuple
    const [currentItem] = await otcgs
      .select()
      .from(inventoryItem)
      .where(and(eq(inventoryItem.id, input.id), notDeleted()))
      .limit(1);

    if (currentItem) {
      const effectiveCondition = input.condition ?? currentItem.condition;
      const effectiveCostBasis = changingCostBasis ? (input.costBasis ?? 0) : currentItem.costBasis;
      const effectiveAcquisitionDate = changingAcquisitionDate
        ? (input.acquisitionDate ?? todayDateString())
        : currentItem.acquisitionDate;

      // Look for an existing row with the same unique tuple (scoped by org)
      const dupConditions = [
        eq(inventoryItem.organizationId, currentItem.organizationId),
        eq(inventoryItem.productId, currentItem.productId),
        eq(inventoryItem.condition, effectiveCondition),
        eq(inventoryItem.costBasis, effectiveCostBasis),
        eq(inventoryItem.acquisitionDate, effectiveAcquisitionDate),
        notDeleted(),
      ];

      const [existingMatch] = await otcgs
        .select()
        .from(inventoryItem)
        .where(and(...dupConditions))
        .limit(1);

      // If a different row matches the target tuple, merge into it
      if (existingMatch && existingMatch.id !== input.id) {
        const effectiveQuantity = input.quantity ?? currentItem.quantity;
        const mergedQuantity = existingMatch.quantity + effectiveQuantity;

        // Soft-delete the item being edited (it will be absorbed into the match)
        await otcgs
          .update(inventoryItem)
          .set({ deletedAt: new Date(), quantity: 0, updatedBy: userId, updatedAt: new Date() })
          .where(eq(inventoryItem.id, input.id));

        // Update the surviving row with merged quantity and any other provided fields
        const mergeUpdates: Record<string, unknown> = {
          quantity: mergedQuantity,
          updatedBy: userId,
          updatedAt: new Date(),
        };
        if (input.price != null) mergeUpdates.price = input.price;
        if (input.notes !== undefined) mergeUpdates.notes = input.notes ?? null;

        await otcgs.update(inventoryItem).set(mergeUpdates).where(eq(inventoryItem.id, existingMatch.id));

        return (await getInventoryItemById(existingMatch.id))!;
      }
    }
  }

  // No merge needed – apply a normal update
  const updates: Record<string, unknown> = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (input.condition != null) updates.condition = input.condition;
  if (input.quantity != null) updates.quantity = input.quantity;
  if (input.price != null) updates.price = input.price;
  if (input.costBasis !== undefined) updates.costBasis = input.costBasis ?? 0;
  if (input.acquisitionDate !== undefined) {
    updates.acquisitionDate = input.acquisitionDate || todayDateString();
  }
  if (input.notes !== undefined) updates.notes = input.notes ?? null;

  await otcgs.update(inventoryItem).set(updates).where(eq(inventoryItem.id, input.id));

  return (await getInventoryItemById(input.id))!;
}

// ---------------------------------------------------------------------------
// 5. deleteInventoryItem — SOFT DELETE
// ---------------------------------------------------------------------------

export async function deleteInventoryItem(id: number): Promise<boolean> {
  await otcgs
    .update(inventoryItem)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(inventoryItem.id, id));
  return true;
}

// ---------------------------------------------------------------------------
// 6. bulkUpdateInventoryItems
// ---------------------------------------------------------------------------

export async function bulkUpdateInventoryItems(
  input: BulkUpdateInventoryInput,
  userId: string,
): Promise<InventoryItem[]> {
  const changingCondition = input.condition != null;
  const changingCostBasis = input.costBasis !== undefined;
  const changingAcquisitionDate = input.acquisitionDate !== undefined;

  // If the update changes unique-key fields, we may need to merge rows
  if (changingCondition || changingCostBasis || changingAcquisitionDate) {
    return bulkUpdateWithMerge(input, userId);
  }

  // Simple case: no unique-key fields are changing, just do a bulk update.
  const updates: Record<string, unknown> = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (input.quantity != null) updates.quantity = input.quantity;
  if (input.price != null) updates.price = input.price;
  if (input.notes !== undefined) updates.notes = input.notes ?? null;

  await otcgs.update(inventoryItem).set(updates).where(inArray(inventoryItem.id, input.ids));

  // Fetch all updated items
  const rows = await baseInventoryQuery().where(and(inArray(inventoryItem.id, input.ids), notDeleted()));
  return rows.map((r) => mapRow(r as unknown as Record<string, unknown>));
}

/**
 * Handle bulk updates that change unique-key fields (condition, costBasis, or acquisitionDate).
 * When multiple items would end up with the same (productId, condition, costBasis, acquisitionDate)
 * tuple, merge them by summing quantities and keeping one row.
 */
async function bulkUpdateWithMerge(input: BulkUpdateInventoryInput, userId: string): Promise<InventoryItem[]> {
  // 1. Fetch current state of all items being updated
  const currentItems = await otcgs
    .select()
    .from(inventoryItem)
    .where(and(inArray(inventoryItem.id, input.ids), notDeleted()));

  type ItemRow = (typeof currentItems)[number];
  interface MergeGroup {
    productId: number;
    effectiveCondition: string;
    effectiveCostBasis: number;
    effectiveAcquisitionDate: string;
    items: ItemRow[];
  }

  // 2. Group items by their resulting unique tuple
  const groups = new Map<string, MergeGroup>();
  for (const item of currentItems) {
    const effectiveCondition = input.condition ?? item.condition;
    const effectiveCostBasis = input.costBasis !== undefined ? (input.costBasis ?? 0) : item.costBasis;
    const effectiveAcquisitionDate =
      input.acquisitionDate !== undefined
        ? (input.acquisitionDate || todayDateString())
        : item.acquisitionDate;
    const key = `${item.productId}\0${effectiveCondition}\0${effectiveCostBasis}\0${effectiveAcquisitionDate}`;

    let g = groups.get(key);
    if (!g) {
      g = { productId: item.productId, effectiveCondition, effectiveCostBasis, effectiveAcquisitionDate, items: [] };
      groups.set(key, g);
    }
    g.items.push(item);
  }

  const now = new Date();
  const survivingIds: number[] = [];
  const updateSetIds = new Set(input.ids);

  for (const {
    productId,
    effectiveCondition,
    effectiveCostBasis,
    effectiveAcquisitionDate,
    items,
  } of groups.values()) {
    // Check if there's an existing row (not in the update set) with the same tuple (org-scoped)
    const orgId = items[0].organizationId;
    const dupConditions = [
      eq(inventoryItem.organizationId, orgId),
      eq(inventoryItem.productId, productId),
      eq(inventoryItem.condition, effectiveCondition),
      eq(inventoryItem.costBasis, effectiveCostBasis),
      eq(inventoryItem.acquisitionDate, effectiveAcquisitionDate),
      notDeleted(),
    ];

    const [existingMatch] = await otcgs
      .select()
      .from(inventoryItem)
      .where(and(...dupConditions))
      .limit(1);

    // Find if the existing row is outside our update set
    const outsideRow = existingMatch && !updateSetIds.has(existingMatch.id) ? existingMatch : null;

    // Determine the survivor: prefer the outside row if it exists, otherwise the first item in the group
    const survivor = outsideRow ?? items[0];
    const itemsToMerge = outsideRow ? items : items.slice(1);

    // Sum quantities from all items being merged into the survivor
    let totalQuantity = input.quantity ?? survivor.quantity;
    for (const item of itemsToMerge) {
      totalQuantity += input.quantity ?? item.quantity;
    }

    // Build update for the survivor
    const updates: Record<string, unknown> = {
      quantity: totalQuantity,
      updatedBy: userId,
      updatedAt: now,
    };
    if (input.condition != null) updates.condition = input.condition;
    if (input.costBasis !== undefined) updates.costBasis = input.costBasis ?? 0;
    if (input.acquisitionDate !== undefined) {
      updates.acquisitionDate = input.acquisitionDate || todayDateString();
    }
    if (input.price != null) updates.price = input.price;
    if (input.notes !== undefined) updates.notes = input.notes ?? null;

    // Soft-delete the merged items (before updating survivor to avoid constraint issues)
    const idsToSoftDelete = itemsToMerge.map((item) => item.id);
    if (idsToSoftDelete.length > 0) {
      await otcgs
        .update(inventoryItem)
        .set({ deletedAt: now, quantity: 0, updatedBy: userId, updatedAt: now })
        .where(inArray(inventoryItem.id, idsToSoftDelete));
    }

    await otcgs.update(inventoryItem).set(updates).where(eq(inventoryItem.id, survivor.id));
    survivingIds.push(survivor.id);
  }

  // Fetch all surviving items
  const rows = await baseInventoryQuery().where(and(inArray(inventoryItem.id, survivingIds), notDeleted()));
  return rows.map((r) => mapRow(r as unknown as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// 7. bulkDeleteInventoryItems — SOFT DELETE
// ---------------------------------------------------------------------------

export async function bulkDeleteInventoryItems(ids: number[]): Promise<boolean> {
  const now = new Date();
  await otcgs
    .update(inventoryItem)
    .set({ deletedAt: now, updatedAt: now })
    .where(inArray(inventoryItem.id, ids));
  return true;
}

// ---------------------------------------------------------------------------
// 8. searchProducts
// ---------------------------------------------------------------------------

export async function searchProducts(searchTerm: string, game?: string | null): Promise<ProductSearchResult[]> {
  const conditions: ReturnType<typeof eq>[] = [like(product.name, `%${searchTerm}%`)];

  if (game) {
    conditions.push(like(category.seoCategoryName, `${game.toLowerCase()}%`));
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
