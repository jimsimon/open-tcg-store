import type   { QueryResolvers } from './../../../types.generated';
import { eq } from "drizzle-orm";
import { magic, pokemon } from "../../../../db";
import { cardIdentifiers, cards as mtgCards, sets as mtgSets } from "../../../../db/mtg/schema";
import type { Card } from "./../../../types.generated";
import { buildMagicImages, createFakeInventory } from "./utils";

export const getCard: NonNullable<QueryResolvers['getCard']> = async (_parent, { game, cardId }, _ctx) => {
  if (cardId === null) {
    throw new Error(`Invalid card id: ${cardId}`);
  }

  try {
    if (game === "magic") {
      return await getMagicCard(cardId);
    } else if (game === "pokemon") {
      return await getPokemonCard(cardId);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }

  throw new Error(`Unsupported game: ${game}`);
};

async function getMagicCard(cardId: string): Promise<Card> {
  const cards = await magic
    .select({
      uuid: mtgCards.uuid,
      name: mtgCards.name,
      finishes: mtgCards.finishes,
      setName: mtgSets.name,
      scryfallId: cardIdentifiers.scryfallId,
      multiverseId: cardIdentifiers.multiverseId,
    })
    .from(mtgCards)
    .innerJoin(cardIdentifiers, eq(mtgCards.uuid, cardIdentifiers.uuid))
    .innerJoin(mtgSets, eq(mtgCards.setCode, mtgSets.code))
    .where(eq(mtgCards.uuid, cardId));

  if (cards.length > 0) {
    const card = cards[0];
    return {
      id: card.uuid,
      name: card.name || "Unknown Card",
      finishes: card.finishes?.split(", ") ?? [],
      setName: card.setName || "Unknown Set",
      images: buildMagicImages(card.scryfallId, card.multiverseId),
      inventory: createFakeInventory(),
    };
  }
  throw new Error(`Unable to find card with id: ${cardId}`);
}

async function getPokemonCard(cardId: string): Promise<Card> {
  const card = await pokemon.query.cards.findFirst({
    columns: {
      id: true,
      name: true,
      rarity: true,
    },
    with: {
      set: {
        columns: {
          name: true,
        },
      },
      images: {
        columns: {
          imageType: true,
          url: true,
        },
      },
    },
    where: (pokemonCards, { eq }) => eq(pokemonCards.id, cardId),
  });

  if (card) {
    return {
      id: card.id,
      name: card.name,
      setName: card.set?.name ?? "Unknown Set",
      finishes: card.rarity === "Rare Holo" ? ["holo"] : [],
      images: card.images.reduce((map, { imageType, url }) => {
        map[imageType] = url;
        return map;
      }, {}),
      inventory: createFakeInventory(),
    };
  }
  throw new Error(`Unable to find card with id: ${cardId}`);
}
