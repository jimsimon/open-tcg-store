import { eq, and, like, sql, inArray, isNull } from "drizzle-orm";
import { otcgs, inventoryItem } from "../db/otcgs/index";
import { product, group, category, productExtendedData, price } from "../db/tcg-data/schema";
import type {
  InventoryItem,
  InventoryPage,
  InventoryFilters,
  PaginationInput,
  AddInventoryItemInput,
  UpdateInventoryItemInput,
  BulkUpdateInventoryInput,
  ProductSearchResult,
} from "../schema/types.generated";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/**
 * Build the base SELECT + JOINs used by both list and single-item queries.
 * Returns a query builder that can be further filtered / paginated.
 */
function baseInventoryQuery() {
  return otcgs
    .select({
      id: inventoryItem.id,
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
      )`.as("rarity"),
      // isSingle flag
      isSingle: sql<boolean>`(
        EXISTS (
          SELECT 1 FROM ${productExtendedData}
          WHERE ${productExtendedData.productId} = ${product.id}
            AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
        )
      )`.as("is_single"),
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
    productId: number;
    productName: string;
    gameName: string | null;
    setName: string | null;
    condition: string;
    quantity: number;
    price: number;
    costBasis: number | null;
    acquisitionDate: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    rarity: string | null;
    isSingle: boolean | number;
  };

  const isSingle = Boolean(r.isSingle);

  return {
    id: r.id,
    productId: r.productId,
    productName: r.productName ?? "",
    gameName: r.gameName ?? "",
    setName: r.setName ?? "",
    rarity: r.rarity ?? null,
    isSingle,
    isSealed: !isSingle,
    condition: r.condition,
    quantity: r.quantity,
    price: r.price,
    costBasis: r.costBasis ?? null,
    acquisitionDate: formatDate(r.acquisitionDate),
    notes: r.notes ?? null,
    createdAt: formatDate(r.createdAt) ?? new Date().toISOString(),
    updatedAt: formatDate(r.updatedAt) ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 1. getInventoryItems
// ---------------------------------------------------------------------------

export async function getInventoryItems(
  filters?: InventoryFilters | null,
  pagination?: PaginationInput | null,
): Promise<InventoryPage> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  // Build WHERE conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (filters?.gameName) {
    conditions.push(eq(category.name, filters.gameName));
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
    // Only singles – must have Rarity or Number extended data
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
      )`,
    );
  } else if (includeSealed === true && includeSingles !== true) {
    // Only sealed – must NOT have Rarity or Number extended data
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
      )`,
    );
  }
  // When both true or both null/undefined → include all (no filter)

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
  const rows = await baseInventoryQuery().where(eq(inventoryItem.id, id)).limit(1);

  if (rows.length === 0) return null;
  return mapRow(rows[0] as unknown as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// 3. addInventoryItem
// ---------------------------------------------------------------------------

export async function addInventoryItem(input: AddInventoryItemInput, userId: string): Promise<InventoryItem> {
  // Check for existing row with same productId + condition + costBasis
  const duplicateConditions = [
    eq(inventoryItem.productId, input.productId),
    eq(inventoryItem.condition, input.condition),
  ];

  if (input.costBasis != null) {
    duplicateConditions.push(eq(inventoryItem.costBasis, input.costBasis));
  } else {
    duplicateConditions.push(isNull(inventoryItem.costBasis));
  }

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
      productId: input.productId,
      condition: input.condition,
      quantity: input.quantity,
      price: input.price,
      costBasis: input.costBasis ?? null,
      acquisitionDate: input.acquisitionDate ? new Date(input.acquisitionDate) : null,
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
  const updates: Record<string, unknown> = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (input.condition != null) updates.condition = input.condition;
  if (input.quantity != null) updates.quantity = input.quantity;
  if (input.price != null) updates.price = input.price;
  if (input.costBasis !== undefined) updates.costBasis = input.costBasis ?? null;
  if (input.acquisitionDate !== undefined) {
    updates.acquisitionDate = input.acquisitionDate ? new Date(input.acquisitionDate) : null;
  }
  if (input.notes !== undefined) updates.notes = input.notes ?? null;

  await otcgs.update(inventoryItem).set(updates).where(eq(inventoryItem.id, input.id));

  return (await getInventoryItemById(input.id))!;
}

// ---------------------------------------------------------------------------
// 5. deleteInventoryItem
// ---------------------------------------------------------------------------

export async function deleteInventoryItem(id: number): Promise<boolean> {
  await otcgs.delete(inventoryItem).where(eq(inventoryItem.id, id));
  return true;
}

// ---------------------------------------------------------------------------
// 6. bulkUpdateInventoryItems
// ---------------------------------------------------------------------------

export async function bulkUpdateInventoryItems(
  input: BulkUpdateInventoryInput,
  userId: string,
): Promise<InventoryItem[]> {
  const updates: Record<string, unknown> = {
    updatedBy: userId,
    updatedAt: new Date(),
  };

  if (input.condition != null) updates.condition = input.condition;
  if (input.quantity != null) updates.quantity = input.quantity;
  if (input.price != null) updates.price = input.price;
  if (input.costBasis !== undefined) updates.costBasis = input.costBasis ?? null;
  if (input.acquisitionDate !== undefined) {
    updates.acquisitionDate = input.acquisitionDate ? new Date(input.acquisitionDate) : null;
  }
  if (input.notes !== undefined) updates.notes = input.notes ?? null;

  await otcgs.update(inventoryItem).set(updates).where(inArray(inventoryItem.id, input.ids));

  // Fetch all updated items
  const rows = await baseInventoryQuery().where(inArray(inventoryItem.id, input.ids));
  return rows.map((r) => mapRow(r as unknown as Record<string, unknown>));
}

// ---------------------------------------------------------------------------
// 7. bulkDeleteInventoryItems
// ---------------------------------------------------------------------------

export async function bulkDeleteInventoryItems(ids: number[]): Promise<boolean> {
  await otcgs.delete(inventoryItem).where(inArray(inventoryItem.id, ids));
  return true;
}

// ---------------------------------------------------------------------------
// 8. searchProducts
// ---------------------------------------------------------------------------

export async function searchProducts(searchTerm: string, game?: string | null): Promise<ProductSearchResult[]> {
  const conditions: ReturnType<typeof eq>[] = [like(product.name, `%${searchTerm}%`)];

  if (game) {
    conditions.push(eq(category.name, game));
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
      )`.as("rarity"),
      isSingle: sql<boolean>`(
        EXISTS (
          SELECT 1 FROM ${productExtendedData}
          WHERE ${productExtendedData.productId} = ${product.id}
            AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
        )
      )`.as("is_single"),
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
      name: r.name ?? "",
      gameName: r.gameName ?? "",
      setName: r.setName ?? "",
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
