import { sql, and } from 'drizzle-orm';
import { otcgs } from '../../../../db';
import { productExtendedData } from '../../../../db/tcg-data/schema';
import { inventoryItem } from '../../../../db/otcgs/inventory-schema';
import { inventoryItemStock } from '../../../../db/otcgs/inventory-stock-schema';
import { getOrganizationIdOptional } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { Card, InputMaybe, SingleCardFilters, type QueryResolvers } from '../../../types.generated';

export const getSingleCardInventory: NonNullable<QueryResolvers['getSingleCardInventory']> = async (
  _parent,
  { game, filters },
  ctx: GraphqlContext,
) => {
  const organizationId = getOrganizationIdOptional(ctx);

  try {
    if (game === 'magic') {
      return await getInventory(1, filters, organizationId);
    } else if (game === 'pokemon') {
      return await getInventory(2, filters, organizationId);
    }
  } catch (e) {
    console.error(e);
  }

  throw new Error(`Unsupported game: ${game}`);
};

async function getInventory(categoryId: number, filters: InputMaybe<SingleCardFilters>, organizationId: string | null) {
  const includeSingles = filters?.includeSingles;
  const includeSealed = filters?.includeSealed;

  const results = await otcgs.query.product.findMany({
    columns: {
      id: true,
      name: true,
      tcgpProductId: true,
    },
    with: {
      group: {
        columns: {
          name: true,
        },
      },
      prices: {
        columns: {
          marketPrice: true,
          midPrice: true,
          subTypeName: true,
        },
      },
    },
    where: (product, { and, like, eq, exists }) =>
      and(
        eq(product.categoryId, categoryId),
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? like(sql`lower(${product.name})`, `%${filters.searchTerm.toLowerCase()}%`)
          : undefined,
        filters?.setCode ? eq(product.groupId, parseInt(filters.setCode, 10)) : undefined,
        // Product type filtering: singles vs sealed
        includeSingles === true && includeSealed !== true
          ? exists(
              otcgs
                .select({ one: sql`1` })
                .from(productExtendedData)
                .where(
                  and(
                    eq(productExtendedData.productId, product.id),
                    sql`(${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')`,
                  ),
                ),
            )
          : undefined,
        includeSealed === true && includeSingles !== true
          ? sql`NOT EXISTS (
              SELECT 1 FROM ${productExtendedData}
              WHERE ${productExtendedData.productId} = ${product.id}
                AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
            )`
          : undefined,
      ),
    orderBy: (product, { asc }) => asc(product.name),
    limit: 10,
  });

  // Fetch real inventory data for all products — derive quantity from stock entries
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

  // Build a nested map: productId -> condition -> { quantity, price }
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

  function getConditionInventory(
    productId: number,
    condition: string,
    marketPrice: number | null,
    midPrice: number | null,
  ) {
    const inv = inventoryMap.get(productId)?.get(condition);
    const fallbackPrice = marketPrice || midPrice || 0;
    const conditionMultiplier: Record<string, number> = {
      NM: 1.0,
      LP: 0.8,
      MP: 0.5,
      HP: 0.3,
      D: 0.2,
    };
    const multiplier = conditionMultiplier[condition] ?? 1.0;

    return {
      quantity: inv?.quantity ?? 0,
      price: inv?.price != null ? inv.price.toFixed(2) : (fallbackPrice * multiplier).toFixed(2),
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
        images: {
          small: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_200x200.jpg`,
          large: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_1000x1000.jpg`,
        },
        inventory: [
          {
            type: subTypeName,
            NM: getConditionInventory(result.id, 'NM', marketPrice, midPrice),
            LP: getConditionInventory(result.id, 'LP', marketPrice, midPrice),
            MP: getConditionInventory(result.id, 'MP', marketPrice, midPrice),
            HP: getConditionInventory(result.id, 'HP', marketPrice, midPrice),
            D: getConditionInventory(result.id, 'D', marketPrice, midPrice),
          },
        ],
      });
    }
  }
  return cards;
}
