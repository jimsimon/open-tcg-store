import { sql, eq } from 'drizzle-orm';
import type { QueryResolvers, Card } from '../../../types.generated';
import { otcgs } from '../../../../db';
import { inventoryItem } from '../../../../db/otcgs/inventory-schema';

export const getCard: NonNullable<QueryResolvers['getCard']> = async (_parent, { game, cardId }, _ctx) => {
  if (cardId === null) {
    throw new Error(`Invalid card id: ${cardId}`);
  }

  try {
    if (game === 'magic' || game === 'pokemon') {
      return await getCardFromDb(Number.parseInt(cardId, 10));
    }
  } catch (e) {
    console.error(e);
    throw e;
  }

  throw new Error(`Unsupported game: ${game}`);
};

async function getCardFromDb(cardId: number): Promise<NonNullable<Card>> {
  const result = await otcgs.query.product.findFirst({
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
      extendedData: {
        columns: {
          name: true,
          value: true,
        },
      },
    },
    where: (product, { eq }) => eq(product.id, cardId),
  });

  if (!result) {
    throw new Error(`Unable to find card with id: ${cardId}`);
  }

  // Fetch real inventory data grouped by condition
  const inventoryData = await otcgs
    .select({
      condition: inventoryItem.condition,
      totalQuantity: sql<number>`COALESCE(SUM(${inventoryItem.quantity}), 0)`.as('total_quantity'),
      lowestPrice: sql<number | null>`MIN(${inventoryItem.price})`.as('lowest_price'),
    })
    .from(inventoryItem)
    .where(eq(inventoryItem.productId, cardId))
    .groupBy(inventoryItem.condition);

  // Build a map of condition -> { quantity, price }
  const inventoryMap = new Map(
    inventoryData.map((row) => [row.condition, { quantity: row.totalQuantity, price: row.lowestPrice }]),
  );

  const extendedDataMap = result.extendedData.reduce(
    (map, { name, value }) => {
      map[name] = value;
      return map;
    },
    {} as Record<string, string>,
  );

  // Helper to get inventory for a condition, falling back to market/mid price
  function getConditionInventory(condition: string, marketPrice: number | null, midPrice: number | null) {
    const inv = inventoryMap.get(condition);
    const fallbackPrice = marketPrice || midPrice || 0;
    // Apply condition-based discount for fallback prices
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

  return {
    id: result.id.toString(),
    name: result.name,
    finishes: result.prices.map((p) => p.subTypeName),
    setName: result.group?.name || 'Unknown Set',
    rarity: extendedDataMap.Rarity,
    type: extendedDataMap.SubType ?? extendedDataMap['Card Type'],
    text: extendedDataMap.OracleText ?? extendedDataMap.CardText,
    flavorText: extendedDataMap.FlavorText,
    images: {
      small: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_200x200.jpg`,
      large: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_1000x1000.jpg`,
    },
    inventory: result.prices.map((p) => ({
      type: p.subTypeName,
      NM: getConditionInventory('NM', p.marketPrice, p.midPrice),
      LP: getConditionInventory('LP', p.marketPrice, p.midPrice),
      MP: getConditionInventory('MP', p.marketPrice, p.midPrice),
      HP: getConditionInventory('HP', p.marketPrice, p.midPrice),
      D: getConditionInventory('D', p.marketPrice, p.midPrice),
    })),
  };
}
