import { sql, and, like, eq, exists, isNull, gt } from 'drizzle-orm';
import { otcgs } from '../../../../db';
import { product, productExtendedData } from '../../../../db/tcg-data/schema';
import { escapeLikeWildcards } from '../../../../lib/sql-utils';
import { inventoryItem } from '../../../../db/otcgs/inventory-schema';
import { inventoryItemStock } from '../../../../db/otcgs/inventory-stock-schema';
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

async function queryProductListings(
  filters: InputMaybe<ProductListingFilters>,
  limit: number,
  offset: number,
  organizationId: string | null,
) {
  const includeSingles = filters?.includeSingles;
  const includeSealed = filters?.includeSealed;
  const inStockOnly = filters?.inStockOnly ?? false;

  // Resolve game name to category ID via database lookup
  let categoryId: number | undefined;
  if (filters?.gameName) {
    const cat = await otcgs.query.category.findFirst({
      columns: { id: true },
      where: (c, { eq }) => eq(c.name, filters.gameName!),
    });
    if (cat) {
      categoryId = cat.id;
    }
  }

  // Resolve condition filter
  const conditionFilter = filters?.condition ?? null;

  // Build WHERE conditions
  const conditions = [];

  if (categoryId !== undefined) {
    conditions.push(eq(product.categoryId, categoryId));
  }

  if (filters?.searchTerm && filters.searchTerm.trim().length > 0) {
    conditions.push(like(sql`lower(${product.name})`, `%${escapeLikeWildcards(filters.searchTerm.toLowerCase())}%`));
  }

  if (filters?.setCode) {
    conditions.push(eq(product.groupId, Number.parseInt(filters.setCode, 10)));
  }

  // If condition filter is set, only show products that have inventory in that condition
  // We need to check for a parent inventory_item with that condition that has stock entries
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

  // Build the base query with LEFT JOINs: product -> inventory_item -> inventory_item_stock
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Derive quantity from stock entries via double LEFT JOIN
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

  // Apply inStockOnly filter using HAVING
  const queryWithHaving = inStockOnly
    ? baseQuery.having(sql`COALESCE(SUM(
        CASE WHEN ${inventoryItemStock.deletedAt} IS NULL THEN ${inventoryItemStock.quantity} ELSE 0 END
      ), 0) > 0`)
    : baseQuery;

  // Get total count first (without pagination)
  const orgJoinSql = organizationId ? sql`AND ${inventoryItem.organizationId} = ${organizationId}` : sql``;
  const countQuery = otcgs
    .select({
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(
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
      category: {
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

  // Fetch per-condition pricing for all product IDs
  // Join inventory_item with stock to derive quantity per condition
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

  // Also fetch the specific inventory item ID with the lowest price per product+condition
  // (only where there's stock with quantity > 0)
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
      gameName: productData?.category?.name ?? 'Unknown',
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
