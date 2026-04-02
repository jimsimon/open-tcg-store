import { sql, and, like, eq, exists, isNull, gt } from 'drizzle-orm';
import { otcgs } from '../../../../db';
import { product, productExtendedData } from '../../../../db/tcg-data/schema';
import { inventoryItem } from '../../../../db/otcgs/inventory-schema';
import { getOrganizationIdOptional } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import type { InputMaybe, ProductListingFilters, QueryResolvers } from '../../../types.generated';

export const getProductListings: NonNullable<QueryResolvers['getProductListings']> = async (
  _parent,
  { filters, pagination },
  ctx: GraphqlContext,
) => {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;
  const organizationId = getOrganizationIdOptional(ctx);

  const { items, totalCount } = await queryProductListings(filters, pageSize, offset, organizationId);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
};

async function queryProductListings(filters: InputMaybe<ProductListingFilters>, limit: number, offset: number, organizationId: string | null) {
  const includeSingles = filters?.includeSingles;
  const includeSealed = filters?.includeSealed;
  const inStockOnly = filters?.inStockOnly ?? false;

  // Resolve game name to category ID
  let categoryId: number | undefined;
  if (filters?.gameName === 'magic') {
    categoryId = 1;
  } else if (filters?.gameName === 'pokemon') {
    categoryId = 2;
  }

  // Resolve condition filter
  const conditionFilter = filters?.condition ?? null;

  // Build WHERE conditions
  const conditions = [];

  if (categoryId !== undefined) {
    conditions.push(eq(product.categoryId, categoryId));
  }

  if (filters?.searchTerm && filters.searchTerm.trim().length > 0) {
    conditions.push(like(sql`lower(${product.name})`, `%${filters.searchTerm.toLowerCase()}%`));
  }

  if (filters?.setCode) {
    conditions.push(eq(product.groupId, Number.parseInt(filters.setCode, 10)));
  }

  // If condition filter is set, only show products that have inventory in that condition
  if (conditionFilter) {
    conditions.push(
      exists(
        otcgs
          .select({ one: sql`1` })
          .from(inventoryItem)
          .where(
            and(
              eq(inventoryItem.productId, product.id),
              eq(inventoryItem.condition, conditionFilter),
              gt(inventoryItem.quantity, 0),
              isNull(inventoryItem.deletedAt),
              organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined,
            ),
          ),
      ),
    );
  }

  // Product type filtering: singles vs sealed
  if (includeSingles === true && includeSealed !== true) {
    conditions.push(
      exists(
        otcgs
          .select({ one: sql`1` })
          .from(productExtendedData)
          .where(
            and(
              eq(productExtendedData.productId, product.id),
              sql`(${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')`,
            ),
          ),
      ),
    );
  }

  if (includeSealed === true && includeSingles !== true) {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${productExtendedData}
        WHERE ${productExtendedData.productId} = ${product.id}
          AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
      )`,
    );
  }

  // Build the base query with LEFT JOIN to inventory_item
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Query with aggregation
  const baseQuery = otcgs
    .select({
      id: product.id,
      name: product.name,
      tcgpProductId: product.tcgpProductId,
      groupId: product.groupId,
      totalQuantity: sql<number>`COALESCE(SUM(${inventoryItem.quantity}), 0)`.as('total_quantity'),
      lowestPrice: sql<number | null>`MIN(${inventoryItem.price})`.as('lowest_price'),
    })
    .from(product)
    .leftJoin(
      inventoryItem,
      and(
        eq(inventoryItem.productId, product.id),
        isNull(inventoryItem.deletedAt),
        gt(inventoryItem.quantity, 0),
        organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined,
      ),
    )
    .where(whereClause)
    .groupBy(product.id);

  // Apply inStockOnly filter using HAVING
  const queryWithHaving = inStockOnly ? baseQuery.having(sql`SUM(${inventoryItem.quantity}) > 0`) : baseQuery;

  // Get total count first (without pagination)
  const orgJoinCondition = organizationId
    ? sql`AND ${inventoryItem.organizationId} = ${organizationId}`
    : sql``;
  const countQuery = otcgs
    .select({
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(
      inStockOnly
        ? sql`(
            SELECT ${product.id}
            FROM ${product}
            LEFT JOIN ${inventoryItem} ON ${inventoryItem.productId} = ${product.id} ${orgJoinCondition}
            ${whereClause ? sql`WHERE ${whereClause}` : sql``}
            GROUP BY ${product.id}
            HAVING SUM(${inventoryItem.quantity}) > 0
          ) AS filtered`
        : sql`(
            SELECT ${product.id}
            FROM ${product}
            ${whereClause ? sql`WHERE ${whereClause}` : sql``}
          ) AS filtered`,
    );

  const [countResult] = await countQuery;
  const totalCount = countResult?.count ?? 0;

  // Get paginated results
  const results = await queryWithHaving.orderBy(product.name).limit(limit).offset(offset);

  // Now fetch group names and extended data for the results
  const productIds = results.map((r) => r.id);
  if (productIds.length === 0) {
    return { items: [], totalCount };
  }

  // Fetch group names
  const productsWithGroups = await otcgs.query.product.findMany({
    columns: {
      id: true,
      name: true,
      tcgpProductId: true,
      categoryId: true,
    },
    with: {
      group: {
        columns: {
          name: true,
        },
      },
      prices: {
        columns: {
          subTypeName: true,
          marketPrice: true,
        },
      },
      extendedData: {
        columns: {
          name: true,
          value: true,
        },
      },
    },
    where: (p, { inArray }) => inArray(p.id, productIds),
  });

  // Build a lookup map
  const productMap = new Map(productsWithGroups.map((p) => [p.id, p]));

  // Map game name from categoryId
  function getGameName(catId: number | null | undefined): string {
    if (catId === 1) return 'Magic';
    if (catId === 2) return 'Pokemon';
    return 'Unknown';
  }

  // Fetch per-condition pricing for all product IDs (exclude soft-deleted and zero-qty)
  // We need the inventory item with the lowest price per product+condition for the inventoryItemId
  const conditionPricesRaw =
    productIds.length > 0
      ? await otcgs
          .select({
            productId: inventoryItem.productId,
            condition: inventoryItem.condition,
            quantity: sql<number>`SUM(${inventoryItem.quantity})`.as('cond_qty'),
            price: sql<number>`MIN(${inventoryItem.price})`.as('cond_price'),
          })
          .from(inventoryItem)
          .where(
            and(
              sql`${inventoryItem.productId} IN (${sql.join(
                productIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
              isNull(inventoryItem.deletedAt),
              gt(inventoryItem.quantity, 0),
              organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined,
            ),
          )
          .groupBy(inventoryItem.productId, inventoryItem.condition)
      : [];

  // Also fetch the specific inventory item ID with the lowest price per product+condition
  const inventoryItemIdsRaw =
    productIds.length > 0
      ? await otcgs
          .select({
            id: inventoryItem.id,
            productId: inventoryItem.productId,
            condition: inventoryItem.condition,
            price: inventoryItem.price,
          })
          .from(inventoryItem)
          .where(
            and(
              sql`${inventoryItem.productId} IN (${sql.join(
                productIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
              gt(inventoryItem.quantity, 0),
              isNull(inventoryItem.deletedAt),
              organizationId ? eq(inventoryItem.organizationId, organizationId) : undefined,
            ),
          )
          .orderBy(inventoryItem.price)
      : [];

  // Build a map: productId+condition -> lowest-priced inventoryItemId
  const lowestPriceItemMap = new Map<string, number>();
  for (const row of inventoryItemIdsRaw) {
    const key = `${row.productId}:${row.condition}`;
    if (!lowestPriceItemMap.has(key)) {
      lowestPriceItemMap.set(key, row.id);
    }
  }

  // Build condition prices lookup: productId -> conditionPrices[]
  const conditionPricesMap = new Map<
    number,
    { inventoryItemId: number; condition: string; quantity: number; price: number }[]
  >();
  for (const row of conditionPricesRaw) {
    const arr = conditionPricesMap.get(row.productId) ?? [];
    const key = `${row.productId}:${row.condition}`;
    const inventoryItemId = lowestPriceItemMap.get(key) ?? 0;
    arr.push({ inventoryItemId, condition: row.condition, quantity: row.quantity, price: row.price });
    conditionPricesMap.set(row.productId, arr);
  }

  const items = results.map((r) => {
    const productData = productMap.get(r.id);
    const extendedDataMap = (productData?.extendedData ?? []).reduce(
      (map, { name, value }) => {
        map[name] = value;
        return map;
      },
      {} as Record<string, string>,
    );

    // Get finishes from prices
    const finishes = productData?.prices?.map((p) => p.subTypeName) ?? [];

    // If no inventory price, fall back to market price
    let lowestPrice: string | null = null;
    if (r.lowestPrice != null) {
      lowestPrice = r.lowestPrice.toFixed(2);
    } else if (productData?.prices?.[0]?.marketPrice != null) {
      lowestPrice = productData.prices[0].marketPrice.toFixed(2);
    }

    // Get per-condition pricing, sorted by condition order
    const conditionOrder = ['NM', 'LP', 'MP', 'HP', 'D'];
    const conditionPrices = (conditionPricesMap.get(r.id) ?? [])
      .filter((cp) => cp.quantity > 0)
      .sort((a, b) => conditionOrder.indexOf(a.condition) - conditionOrder.indexOf(b.condition));

    // Get the inventoryItemId for the overall lowest-priced item (for sealed products)
    const allConditionItems = conditionPricesMap.get(r.id) ?? [];
    const lowestPriceItem =
      allConditionItems.length > 0
        ? allConditionItems.reduce((min, cp) => (cp.price < min.price ? cp : min), allConditionItems[0])
        : null;

    return {
      id: r.id.toString(),
      name: r.name,
      setName: productData?.group?.name ?? 'Unknown Set',
      gameName: getGameName(productData?.categoryId),
      rarity: extendedDataMap.Rarity ?? null,
      finishes,
      images: {
        small: `https://tcgplayer-cdn.tcgplayer.com/product/${r.tcgpProductId}_in_200x200.jpg`,
        large: `https://tcgplayer-cdn.tcgplayer.com/product/${r.tcgpProductId}_in_1000x1000.jpg`,
      },
      totalQuantity: r.totalQuantity,
      lowestPrice,
      lowestPriceInventoryItemId: lowestPriceItem?.inventoryItemId ?? null,
      conditionPrices,
    };
  });

  return { items, totalCount };
}
