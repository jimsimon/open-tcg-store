import { eq, like, sql, and, inArray } from "drizzle-orm";
import { magic, pokemon } from "../../../../db";
import { cardIdentifiers, cards as mtgCards, sets as mtgSets } from "../../../../db/mtg/schema";
import { cards as pokemonCards, sets as pokemonSets, cardImages } from "../../../../db/pokemon/schema";
import { Card, CardImages, InputMaybe, SingleCardFilters, type QueryResolvers } from "../../../types.generated";
import { buildMagicImages, createFakeInventory } from "./utils";

export const getSingleCardInventory: NonNullable<QueryResolvers["getSingleCardInventory"]> = async (
  _parent,
  { game, filters },
  _ctx,
) => {
  try {
    if (game === "magic") {
      return await getMagicInventory(filters);
    } else if (game === "pokemon") {
      return await getPokemonInventory(filters);
    }
  } catch (e) {
    console.error(e);
  }

  throw new Error(`Unsupported game: ${game}`);
};

async function getMagicInventory(filters: InputMaybe<SingleCardFilters>) {
  const result = await magic
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
    .where(
      and(
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? like(sql`lower(${mtgCards.name})`, `%${filters.searchTerm.toLowerCase()}%`)
          : undefined,
        filters?.setCode ? eq(mtgSets.code, filters.setCode) : undefined,
      ),
    )
    .orderBy(mtgCards.name)
    .limit(20);

  return result.map<Card>((card) => ({
    id: card.uuid,
    name: card.name || "Unknown Card",
    finishes: card.finishes?.split(", ") ?? [],
    setName: card.setName || "Unknown Set",
    images: buildMagicImages(card.scryfallId, card.multiverseId),
    inventory: createFakeInventory(),
  }));
}

async function getPokemonInventory(filters: InputMaybe<SingleCardFilters>) {
  const result = await pokemon.query.cards.findMany({
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
    where: (cards, { and, like, eq }) =>
      and(
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? like(sql`lower(${cards.name})`, `%${filters.searchTerm.toLowerCase()}%`)
          : undefined,
        filters?.setCode ? eq(cards.setId, filters.setCode) : undefined,
      ),
    orderBy: (cards, { asc }) => asc(cards.name),
    limit: 20,
  });

  return result.map<Card>((card) => ({
    id: card.id,
    name: card.name,
    setName: card.set?.name ?? "Unknown Set",
    finishes: card.rarity === "Rare Holo" ? ["holo"] : [],
    images: card.images.reduce((map, { imageType, url }) => {
      map[imageType] = url;
      return map;
    }, {}),
    inventory: createFakeInventory(),
  }));
}
