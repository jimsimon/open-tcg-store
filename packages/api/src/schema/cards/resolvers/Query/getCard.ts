import type { QueryResolvers, Card } from "../../../types.generated";
import { otcgs } from "../../../../db";
import { createFakeInventory } from "./utils";

export const getCard: NonNullable<QueryResolvers['getCard']> = async (_parent, { game, cardId }, _ctx) => {
  if (cardId === null) {
    throw new Error(`Invalid card id: ${cardId}`);
  }

  try {
    if (game === "magic" || game === "pokemon") {
      return await getCardFromDb(parseInt(cardId, 10));
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

  if (result) {
    const extendedDataMap = result.extendedData.reduce(
      (map, { name, value }) => {
        map[name] = value;
        return map;
      },
      {} as Record<string, string>,
    );
    return {
      id: result.id.toString(),
      name: result.name,
      finishes: result.prices.map((p) => p.subTypeName),
      setName: result.group?.name || "Unknown Set",
      rarity: extendedDataMap["Rarity"],
      type: extendedDataMap["SubType"],
      text: extendedDataMap["OracleText"],
      flavorText: extendedDataMap["FlavorText"],
      images: {
        small: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_200x200.jpg`,
        large: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_1000x1000.jpg`,
      },
      inventory: result.prices.map((p) => {
        return {
          type: p.subTypeName,
          ...createFakeInventory(p.marketPrice, p.midPrice),
        };
      }),
    };
  }
  throw new Error(`Unable to find card with id: ${cardId}`);
}
