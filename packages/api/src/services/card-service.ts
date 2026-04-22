import { sql, and, eq, exists, isNull, gt, gte, lte, inArray } from 'drizzle-orm';
import { otcgs } from '../db';
import { product, priceHistory } from '../db/tcg-data/schema';
import { inventoryItem } from '../db/otcgs/inventory-schema';
import { inventoryItemStock } from '../db/otcgs/inventory-stock-schema';
import { storeSupportedGame } from '../db/otcgs/store-supported-game-schema';
import { likeEscaped } from '../lib/sql-utils';

import type {
  Card,
  CardCondition,
  InputMaybe,
  SingleCardFilters,
  ProductListingFilters,
} from '../schema/types.generated';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Condition-based discount multipliers for fallback pricing. */
const CONDITION_MULTIPLIERS: Record<string, number> = {
  NM: 1.0,
  LP: 0.8,
  MP: 0.5,
  HP: 0.3,
  D: 0.2,
};

const CONDITION_ORDER = ['NM', 'LP', 'MP', 'HP', 'D'];

/** Resolve a game name (e.g. "Magic") to a TCG category ID. */
export async function resolveCategoryId(gameName: string): Promise<number> {
  const cat = await otcgs.query.category.findFirst({
    columns: { id: true },
    where: (c, { eq }) => eq(c.name, gameName),
  });
  if (!cat) throw new Error(`Unsupported game: ${gameName}`);
  return cat.id;
}

/** Build TCG player CDN image URLs for a product. */
function buildImageUrls(tcgpProductId: number | null) {
  return {
    small: `https://tcgplayer-cdn.tcgplayer.com/product/${tcgpProductId}_in_400x400.jpg`,
    large: `https://tcgplayer-cdn.tcgplayer.com/product/${tcgpProductId}_in_1000x1000.jpg`,
  };
}

/** Get inventory for a condition using actual data with market-price fallback. */
function getConditionInventory(
  inventoryMap: Map<string, { quantity: number; price: number | null }>,
  condition: string,
  marketPrice: number | null,
  midPrice: number | null,
) {
  const inv = inventoryMap.get(condition);
  const fallbackPrice = marketPrice || midPrice || 0;
  const multiplier = CONDITION_MULTIPLIERS[condition] ?? 1.0;
  return {
    quantity: inv?.quantity ?? 0,
    price: inv?.price != null ? inv.price : Math.round(fallbackPrice * multiplier),
  };
}

// ---------------------------------------------------------------------------
// getCard
// ---------------------------------------------------------------------------

export async function getCardById(
  cardId: number,
  categoryId: number,
  organizationId: string | null,
): Promise<NonNullable<Card>> {
  const result = await otcgs.query.product.findFirst({
    columns: {
      id: true,
      name: true,
      tcgpProductId: true,
      rarityDisplay: true,
      subType: true,
      cardType: true,
      oracleText: true,
      cardText: true,
      flavorText: true,
      number: true,
      productType: true,
    },
    with: {
      group: { columns: { name: true } },
      prices: { columns: { marketPrice: true, midPrice: true, subTypeName: true } },
    },
    where: (p, { eq, and }) => and(eq(p.id, cardId), eq(p.categoryId, categoryId)),
  });

  if (!result) throw new Error(`Unable to find card with id: ${cardId}`);

  const inventoryData = await otcgs
    .select({
      condition: inventoryItem.condition,
      totalQuantity:
        sql<number>`COALESCE(SUM(CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END), 0)`.as(
          'total_quantity',
        ),
      lowestPrice: sql<number | null>`MIN(${inventoryItem.price})`.as('lowest_price'),
    })
    .from(inventoryItem)
    .leftJoin(inventoryItemStock, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
    .where(
      and(
        eq(inventoryItem.productId, cardId),
        organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined,
      ),
    )
    .groupBy(inventoryItem.id);

  const inventoryMap = new Map(
    inventoryData.map((row) => [row.condition, { quantity: row.totalQuantity, price: row.lowestPrice }]),
  );

  return {
    id: result.id.toString(),
    name: result.name,
    finishes: result.prices.map((p) => p.subTypeName),
    setName: result.group?.name || 'Unknown Set',
    rarity: result.rarityDisplay,
    type: result.subType ?? result.cardType,
    text: result.oracleText ?? result.cardText,
    flavorText: result.flavorText,
    images: buildImageUrls(result.tcgpProductId),
    inventory: result.prices.map((p) => ({
      type: p.subTypeName,
      NM: getConditionInventory(inventoryMap, 'NM', p.marketPrice, p.midPrice),
      LP: getConditionInventory(inventoryMap, 'LP', p.marketPrice, p.midPrice),
      MP: getConditionInventory(inventoryMap, 'MP', p.marketPrice, p.midPrice),
      HP: getConditionInventory(inventoryMap, 'HP', p.marketPrice, p.midPrice),
      D: getConditionInventory(inventoryMap, 'D', p.marketPrice, p.midPrice),
    })),
  };
}

// ---------------------------------------------------------------------------
// getProduct
// ---------------------------------------------------------------------------

export async function getProductById(productId: number, organizationId: string | null) {
  const result = await otcgs.query.product.findFirst({
    columns: {
      id: true,
      name: true,
      tcgpProductId: true,
      categoryId: true,
      rarityDisplay: true,
      subType: true,
      cardType: true,
      oracleText: true,
      cardText: true,
      flavorText: true,
      productType: true,
    },
    with: {
      group: { columns: { name: true } },
      category: { columns: { name: true } },
      prices: { columns: { marketPrice: true, midPrice: true, subTypeName: true } },
    },
    where: (p, { eq }) => eq(p.id, productId),
  });

  if (!result) throw new Error(`Product not found: ${productId}`);

  const isSingle = result.productType === 'single';

  const inventoryRecords = await otcgs
    .select({
      id: inventoryItem.id,
      condition: inventoryItem.condition,
      price: inventoryItem.price,
      totalQuantity:
        sql<number>`COALESCE(SUM(CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END), 0)`.as(
          'total_quantity',
        ),
    })
    .from(inventoryItem)
    .leftJoin(inventoryItemStock, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
    .where(
      and(
        eq(inventoryItem.productId, productId),
        organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined,
      ),
    )
    .groupBy(inventoryItem.id)
    .having(
      sql`COALESCE(SUM(CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END), 0) > 0`,
    )
    .orderBy(inventoryItem.price);

  return {
    id: result.id.toString(),
    name: result.name,
    setName: result.group?.name ?? 'Unknown Set',
    gameName: result.category?.name ?? 'Unknown',
    rarity: result.rarityDisplay ?? null,
    type: result.subType ?? result.cardType ?? null,
    text: result.oracleText ?? result.cardText ?? null,
    flavorText: result.flavorText ?? null,
    finishes: result.prices.map((p) => p.subTypeName),
    isSingle,
    isSealed: !isSingle,
    images: buildImageUrls(result.tcgpProductId),
    inventoryRecords: inventoryRecords.map((r) => ({
      inventoryItemId: r.id,
      condition: r.condition as CardCondition,
      quantity: r.totalQuantity,
      price: r.price,
    })),
  };
}

// ---------------------------------------------------------------------------
// getSets
// ---------------------------------------------------------------------------

export async function getSets(categoryId: number, filters: InputMaybe<{ searchTerm?: string | null }>) {
  const results = await otcgs.query.group.findMany({
    columns: { id: true, name: true },
    where: (group, { and, eq, sql }) =>
      and(
        eq(group.categoryId, categoryId),
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? likeEscaped(sql`lower(${group.name})`, filters.searchTerm.toLowerCase())
          : undefined,
      ),
    orderBy: (group, { asc }) => asc(group.name),
  });

  return results.map((group) => ({
    code: group.id.toString(),
    name: group.name,
  }));
}

// ---------------------------------------------------------------------------
// getSingleCardInventory
// ---------------------------------------------------------------------------

export async function getSingleCardInventory(
  categoryId: number,
  filters: InputMaybe<SingleCardFilters>,
  organizationId: string | null,
): Promise<Card[]> {
  const includeSingles = filters?.includeSingles;
  const includeSealed = filters?.includeSealed;

  const results = await otcgs.query.product.findMany({
    columns: { id: true, name: true, tcgpProductId: true },
    with: {
      group: { columns: { name: true } },
      prices: { columns: { marketPrice: true, midPrice: true, subTypeName: true } },
    },
    where: (p, { and, eq }) =>
      and(
        eq(p.categoryId, categoryId),
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? likeEscaped(sql`lower(${p.name})`, filters.searchTerm.toLowerCase())
          : undefined,
        filters?.setCode ? eq(p.groupId, parseInt(filters.setCode, 10)) : undefined,
        includeSingles === true && includeSealed !== true ? eq(p.productType, 'single') : undefined,
        includeSealed === true && includeSingles !== true ? eq(p.productType, 'sealed') : undefined,
      ),
    orderBy: (p, { asc }) => asc(p.name),
    limit: 10,
  });

  // Fetch inventory data for all products
  const productIds = results.map((r) => r.id);
  const inventoryData =
    productIds.length > 0
      ? await otcgs
          .select({
            productId: inventoryItem.productId,
            condition: inventoryItem.condition,
            totalQuantity: sql<number>`COALESCE(SUM(
              CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END
            ), 0)`.as('total_quantity'),
            lowestPrice: sql<number | null>`MIN(${inventoryItem.price})`.as('lowest_price'),
          })
          .from(inventoryItem)
          .leftJoin(inventoryItemStock, sql`${inventoryItemStock.inventoryItemId} = ${inventoryItem.id}`)
          .where(
            and(
              sql`${inventoryItem.productId} IN (${sql.join(
                productIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
              organizationId ? sql`${inventoryItem.organizationId} = ${organizationId}` : undefined,
            ),
          )
          .groupBy(inventoryItem.productId, inventoryItem.condition)
      : [];

  // Build nested map: productId -> condition -> { quantity, price }
  const inventoryMap = new Map<number, Map<string, { quantity: number; price: number | null }>>();
  for (const row of inventoryData) {
    if (!inventoryMap.has(row.productId)) {
      inventoryMap.set(row.productId, new Map());
    }
    inventoryMap.get(row.productId)!.set(row.condition, {
      quantity: row.totalQuantity,
      price: row.lowestPrice,
    });
  }

  function getPerProductConditionInventory(
    pid: number,
    condition: string,
    marketPrice: number | null,
    midPrice: number | null,
  ) {
    const inv = inventoryMap.get(pid)?.get(condition);
    const fallbackPrice = marketPrice || midPrice || 0;
    const multiplier = CONDITION_MULTIPLIERS[condition] ?? 1.0;
    return {
      quantity: inv?.quantity ?? 0,
      price: inv?.price != null ? inv.price : Math.round(fallbackPrice * multiplier),
    };
  }

  const cards: Card[] = [];
  for (const result of results) {
    for (const { marketPrice, midPrice, subTypeName } of result.prices) {
      cards.push({
        id: result.id.toString(),
        name: result.name,
        finishes: [subTypeName],
        setName: result.group?.name || 'Unknown Set',
        images: buildImageUrls(result.tcgpProductId),
        inventory: [
          {
            type: subTypeName,
            NM: getPerProductConditionInventory(result.id, 'NM', marketPrice, midPrice),
            LP: getPerProductConditionInventory(result.id, 'LP', marketPrice, midPrice),
            MP: getPerProductConditionInventory(result.id, 'MP', marketPrice, midPrice),
            HP: getPerProductConditionInventory(result.id, 'HP', marketPrice, midPrice),
            D: getPerProductConditionInventory(result.id, 'D', marketPrice, midPrice),
          },
        ],
      });
    }
  }
  return cards;
}

// ---------------------------------------------------------------------------
// getProductListings
// ---------------------------------------------------------------------------

export async function getProductListings(
  filters: InputMaybe<ProductListingFilters>,
  pagination: { page: number; pageSize: number },
  organizationId: string | null,
) {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;
  const { items, totalCount } = await queryProductListings(filters, pageSize, offset, organizationId);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

async function queryProductListings(
  filters: InputMaybe<ProductListingFilters>,
  limit: number,
  offset: number,
  organizationId: string | null,
) {
  const includeSingles = filters?.includeSingles;
  const includeSealed = filters?.includeSealed;
  const inStockOnly = filters?.inStockOnly ?? false;

  // Resolve game name to category ID
  let categoryId: number | undefined;
  if (filters?.gameName) {
    const cat = await otcgs.query.category.findFirst({
      columns: { id: true },
      where: (c, { eq }) => eq(c.name, filters.gameName!),
    });
    if (cat) categoryId = cat.id;
  }

  const conditionFilter = filters?.condition ?? null;
  const conditions = [];

  if (categoryId !== undefined) {
    // Specific game selected — filter to that game
    conditions.push(eq(product.categoryId, categoryId));
  } else {
    // No specific game — restrict to store's supported games
    const supportedRows = await otcgs.select({ categoryId: storeSupportedGame.categoryId }).from(storeSupportedGame);
    const supportedIds = supportedRows.map((r) => r.categoryId);
    if (supportedIds.length > 0) {
      conditions.push(inArray(product.categoryId, supportedIds));
    } else {
      // No supported games configured — return empty results
      return { items: [], totalCount: 0 };
    }
  }

  if (filters?.searchTerm && filters.searchTerm.trim().length > 0) {
    conditions.push(likeEscaped(sql`lower(${product.name})`, filters.searchTerm.toLowerCase()));
  }

  if (filters?.setCode) {
    conditions.push(eq(product.groupId, Number.parseInt(filters.setCode, 10)));
  }

  if (conditionFilter) {
    conditions.push(
      exists(
        otcgs
          .select({ one: sql`1` })
          .from(inventoryItem)
          .innerJoin(
            inventoryItemStock,
            and(
              eq(inventoryItemStock.inventoryItemId, inventoryItem.id),
              isNull(inventoryItemStock.deletedAt),
              gt(inventoryItemStock.quantity, 0),
            ),
          )
          .where(
            and(
              eq(inventoryItem.productId, product.id),
              eq(inventoryItem.condition, conditionFilter),
              organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined,
            ),
          ),
      ),
    );
  }

  if (includeSingles === true && includeSealed !== true) {
    conditions.push(eq(product.productType, 'single'));
  }

  if (includeSealed === true && includeSingles !== true) {
    conditions.push(eq(product.productType, 'sealed'));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const orgCondition = organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined;

  const baseQuery = otcgs
    .select({
      id: product.id,
      name: product.name,
      tcgpProductId: product.tcgpProductId,
      groupId: product.groupId,
      totalQuantity: sql<number>`COALESCE(SUM(
        CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END
      ), 0)`.as('total_quantity'),
      lowestPrice: sql<number | null>`MIN(${inventoryItem.price})`.as('lowest_price'),
    })
    .from(product)
    .leftJoin(inventoryItem, and(eq(inventoryItem.productId, product.id), orgCondition))
    .leftJoin(inventoryItemStock, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
    .where(whereClause)
    .groupBy(product.id);

  const queryWithHaving = inStockOnly
    ? baseQuery.having(sql`COALESCE(SUM(
        CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END
      ), 0) > 0`)
    : baseQuery;

  // Count query
  const orgJoinSql = organizationId ? sql`AND ${inventoryItem.organizationId} = ${organizationId}` : sql``;
  const countQuery = otcgs.select({ count: sql<number>`COUNT(*)`.as('count') }).from(
    inStockOnly
      ? sql`(
            SELECT ${product.id}
            FROM ${product}
            LEFT JOIN ${inventoryItem} ON ${inventoryItem.productId} = ${product.id}
              ${orgJoinSql}
            LEFT JOIN ${inventoryItemStock} ON ${inventoryItemStock.inventoryItemId} = ${inventoryItem.id}
            ${whereClause ? sql`WHERE ${whereClause}` : sql``}
            GROUP BY ${product.id}
            HAVING COALESCE(SUM(
              CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END
            ), 0) > 0
          ) AS filtered`
      : sql`(
            SELECT ${product.id}
            FROM ${product}
            ${whereClause ? sql`WHERE ${whereClause}` : sql``}
          ) AS filtered`,
  );

  const [countResult] = await countQuery;
  const totalCount = countResult?.count ?? 0;

  const results = await queryWithHaving.orderBy(product.name).limit(limit).offset(offset);

  const productIds = results.map((r) => r.id);
  if (productIds.length === 0) {
    return { items: [], totalCount };
  }

  // Fetch full product data for results
  const productsWithGroups = await otcgs.query.product.findMany({
    columns: {
      id: true,
      name: true,
      tcgpProductId: true,
      categoryId: true,
      rarityDisplay: true,
      productType: true,
    },
    with: {
      group: { columns: { name: true } },
      category: { columns: { name: true } },
      prices: { columns: { subTypeName: true, marketPrice: true } },
    },
    where: (p, { inArray }) => inArray(p.id, productIds),
  });

  const productMap = new Map(productsWithGroups.map((p) => [p.id, p]));

  // Fetch per-condition pricing
  const conditionPricesRaw =
    productIds.length > 0
      ? await otcgs
          .select({
            productId: inventoryItem.productId,
            condition: inventoryItem.condition,
            quantity: sql<number>`COALESCE(SUM(
              CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END
            ), 0)`.as('cond_qty'),
            price: sql<number>`MIN(${inventoryItem.price})`.as('cond_price'),
          })
          .from(inventoryItem)
          .leftJoin(inventoryItemStock, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
          .where(
            and(
              sql`${inventoryItem.productId} IN (${sql.join(
                productIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
              organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined,
            ),
          )
          .groupBy(inventoryItem.productId, inventoryItem.condition)
      : [];

  // Fetch lowest-priced inventory item IDs
  const inventoryItemIdsRaw =
    productIds.length > 0
      ? await otcgs
          .select({
            id: inventoryItem.id,
            productId: inventoryItem.productId,
            condition: inventoryItem.condition,
            price: inventoryItem.price,
            stockQty: sql<number>`COALESCE(SUM(
              CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END
            ), 0)`.as('stock_qty'),
          })
          .from(inventoryItem)
          .leftJoin(inventoryItemStock, eq(inventoryItemStock.inventoryItemId, inventoryItem.id))
          .where(
            and(
              sql`${inventoryItem.productId} IN (${sql.join(
                productIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
              organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined,
            ),
          )
          .groupBy(inventoryItem.id)
          .having(sql`COALESCE(SUM(
            CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END
          ), 0) > 0`)
          .orderBy(inventoryItem.price)
      : [];

  const lowestPriceItemMap = new Map<string, number>();
  for (const row of inventoryItemIdsRaw) {
    const key = `${row.productId}:${row.condition}`;
    if (!lowestPriceItemMap.has(key)) {
      lowestPriceItemMap.set(key, row.id);
    }
  }

  const conditionPricesMap = new Map<
    number,
    { inventoryItemId: number; condition: CardCondition; quantity: number; price: number }[]
  >();
  for (const row of conditionPricesRaw) {
    const arr = conditionPricesMap.get(row.productId) ?? [];
    const key = `${row.productId}:${row.condition}`;
    const invItemId = lowestPriceItemMap.get(key) ?? 0;
    arr.push({
      inventoryItemId: invItemId,
      condition: row.condition as CardCondition,
      quantity: row.quantity,
      price: row.price,
    });
    conditionPricesMap.set(row.productId, arr);
  }

  const items = results.map((r) => {
    const productData = productMap.get(r.id);
    const finishes = productData?.prices?.map((p) => p.subTypeName) ?? [];

    let lowestPrice: number | null = null;
    if (r.lowestPrice != null) {
      lowestPrice = r.lowestPrice;
    } else if (productData?.prices?.[0]?.marketPrice != null) {
      lowestPrice = productData.prices[0].marketPrice;
    }

    const conditionPrices = (conditionPricesMap.get(r.id) ?? [])
      .filter((cp) => cp.quantity > 0)
      .sort((a, b) => CONDITION_ORDER.indexOf(a.condition) - CONDITION_ORDER.indexOf(b.condition));

    const allConditionItems = conditionPricesMap.get(r.id) ?? [];
    const lowestPriceItem =
      allConditionItems.length > 0
        ? allConditionItems.reduce((min, cp) => (cp.price < min.price ? cp : min), allConditionItems[0])
        : null;

    return {
      id: r.id.toString(),
      name: r.name,
      setName: productData?.group?.name ?? 'Unknown Set',
      gameName: productData?.category?.name ?? 'Unknown',
      rarity: productData?.rarityDisplay ?? null,
      finishes,
      images: buildImageUrls(r.tcgpProductId),
      totalQuantity: r.totalQuantity,
      lowestPrice,
      lowestPriceInventoryItemId: lowestPriceItem?.inventoryItemId ?? null,
      conditionPrices,
    };
  });

  return { items, totalCount };
}

// ---------------------------------------------------------------------------
// getPriceHistory
// ---------------------------------------------------------------------------

export async function getPriceHistory(
  productId: number,
  subTypeName?: string | null,
  startDate?: string | null,
  endDate?: string | null,
) {
  const conditions = [eq(priceHistory.productId, productId)];

  if (subTypeName) {
    conditions.push(eq(priceHistory.subTypeName, subTypeName));
  }
  if (startDate) {
    conditions.push(gte(priceHistory.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(priceHistory.date, endDate));
  }

  const rows = await otcgs
    .select({
      date: priceHistory.date,
      lowPrice: priceHistory.lowPrice,
      midPrice: priceHistory.midPrice,
      highPrice: priceHistory.highPrice,
      marketPrice: priceHistory.marketPrice,
      directLowPrice: priceHistory.directLowPrice,
      subTypeName: priceHistory.subTypeName,
    })
    .from(priceHistory)
    .where(and(...conditions))
    .orderBy(priceHistory.date);

  return rows.map((r) => ({
    date: r.date,
    lowPrice: r.lowPrice ?? null,
    midPrice: r.midPrice ?? null,
    highPrice: r.highPrice ?? null,
    marketPrice: r.marketPrice ?? null,
    directLowPrice: r.directLowPrice ?? null,
    subTypeName: r.subTypeName,
  }));
}
