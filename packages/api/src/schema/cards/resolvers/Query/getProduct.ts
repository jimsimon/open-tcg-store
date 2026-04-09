import { eq, and, sql } from 'drizzle-orm';
import type { QueryResolvers } from '../../../types.generated';
import { otcgs } from '../../../../db';
import { inventoryItem } from '../../../../db/otcgs/inventory-schema';
import { inventoryItemStock } from '../../../../db/otcgs/inventory-stock-schema';
import { getOrganizationIdOptional } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';

export const getProduct: NonNullable<QueryResolvers['getProduct']> = async (
  _parent,
  { productId },
  ctx: GraphqlContext,
) => {
  const id = Number.parseInt(productId, 10);
  if (Number.isNaN(id)) {
    throw new Error(`Invalid product id: ${productId}`);
  }
  const organizationId = getOrganizationIdOptional(ctx);

  const result = await otcgs.query.product.findFirst({
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
          marketPrice: true,
          midPrice: true,
          subTypeName: true,
        },
      },
      extendedData: {
        columns: {
          name: true,
          value: true,
        },
      },
    },
    where: (product, { eq }) => eq(product.id, id),
  });

  if (!result) {
    throw new Error(`Product not found: ${productId}`);
  }

  // Determine if this is a single or sealed product
  const hasRarityOrNumber = result.extendedData.some((d) => d.name === 'Rarity' || d.name === 'Number');
  const isSingle = hasRarityOrNumber;
  const isSealed = !hasRarityOrNumber;

  // Build extended data map
  const extendedDataMap = result.extendedData.reduce(
    (map, { name, value }) => {
      map[name] = value;
      return map;
    },
    {} as Record<string, string>,
  );

  // Fetch parent inventory items with derived quantity from stock
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
        eq(inventoryItem.productId, id),
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
    rarity: extendedDataMap.Rarity ?? null,
    type: extendedDataMap.SubType ?? extendedDataMap['Card Type'] ?? null,
    text: extendedDataMap.OracleText ?? extendedDataMap.CardText ?? null,
    flavorText: extendedDataMap.FlavorText ?? null,
    finishes: result.prices.map((p) => p.subTypeName),
    isSingle,
    isSealed,
    images: {
      small: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_200x200.jpg`,
      large: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_1000x1000.jpg`,
    },
    inventoryRecords: inventoryRecords.map((r) => ({
      inventoryItemId: r.id,
      condition: r.condition,
      quantity: r.totalQuantity,
      price: r.price,
    })),
  };
};
