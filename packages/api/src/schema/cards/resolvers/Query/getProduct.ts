import { eq, and, isNull, gt } from 'drizzle-orm';
import type { QueryResolvers } from '../../../types.generated';
import { otcgs } from '../../../../db';
import { inventoryItem } from '../../../../db/otcgs/inventory-schema';

export const getProduct: NonNullable<QueryResolvers['getProduct']> = async (_parent, { productId }, _ctx) => {
  const id = Number.parseInt(productId, 10);
  if (Number.isNaN(id)) {
    throw new Error(`Invalid product id: ${productId}`);
  }

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

  // Fetch actual inventory records for this product (exclude soft-deleted and zero-qty)
  const inventoryRecords = await otcgs
    .select({
      id: inventoryItem.id,
      condition: inventoryItem.condition,
      quantity: inventoryItem.quantity,
      price: inventoryItem.price,
    })
    .from(inventoryItem)
    .where(and(eq(inventoryItem.productId, id), isNull(inventoryItem.deletedAt), gt(inventoryItem.quantity, 0)))
    .orderBy(inventoryItem.price);

  // Map game name from categoryId
  function getGameName(catId: number | null | undefined): string {
    if (catId === 1) return 'Magic';
    if (catId === 2) return 'Pokemon';
    return 'Unknown';
  }

  return {
    id: result.id.toString(),
    name: result.name,
    setName: result.group?.name ?? 'Unknown Set',
    gameName: getGameName(result.categoryId),
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
      quantity: r.quantity,
      price: r.price,
    })),
  };
};
