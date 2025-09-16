import type { QueryResolvers } from "../../../types.generated";
import { otcgs } from "../../../../db";
import { createFakeInventory } from "./utils";

export const getCard: NonNullable<QueryResolvers["getCard"]> = async (_parent, { game, cardId }, _ctx) => {
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

async function getCardFromDb(cardId: number) {
  const result = await otcgs.query.product.findFirst({
    columns: {
      id: true,
      name: true,
      imageUrl: true,
    },
    with: {
      category: {
        columns: {
          name: true,
        },
      },
      prices: {
        columns: {
          marketPrice: true,
          subTypeName: true,
        },
      },
    },
    where: (product, { eq }) => eq(product.id, cardId),
  });

  if (result) {
    return {
      id: result.id.toString(),
      name: result.name,
      finishes: [result.prices[0].subTypeName],
      setName: result.category?.name || "Unknown Set",
      images: {
        small: result.imageUrl,
        large: result.imageUrl,
      },
      inventory: await createFakeInventory(result.prices[0].marketPrice),
    };
  }
  throw new Error(`Unable to find card with id: ${cardId}`);
}
