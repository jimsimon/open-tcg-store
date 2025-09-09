import { eq, like, sql, and, inArray } from "drizzle-orm";
import { magic, pokemon } from "../../../../db";
import { cardIdentifiers, cards as mtgCards, sets as mtgSets } from "../../../../db/mtg/schema";
import { cards as pokemonCards, sets as pokemonSets, cardImages } from "../../../../db/pokemon/schema";
import { Card, CardImages, InputMaybe, SingleCardFilters, type QueryResolvers } from "./../../../types.generated";

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
    name: card.name ?? "Unknown Card",
    finishes: card.finishes?.split(", ") ?? [],
    setName: card.setName ?? "Unknown Set",
    images: buildMagicImages(card.scryfallId, card.multiverseId),
    inventory: createFakeInventory(),
  }));
}

async function getPokemonInventory(filters: InputMaybe<SingleCardFilters>) {
  const result = await pokemon
    .select({
      id: pokemonCards.id,
      name: pokemonCards.name,
      rarity: pokemonCards.rarity,
      setName: pokemonSets.name,
    })
    .from(pokemonCards)
    .innerJoin(pokemonSets, eq(pokemonCards.setId, pokemonSets.id))
    .where(
      and(
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? like(sql`lower(${pokemonCards.name})`, `%${filters.searchTerm.toLowerCase()}%`)
          : undefined,
        filters?.setCode ? eq(pokemonSets.id, filters.setCode) : undefined,
      ),
    )
    .orderBy(pokemonCards.name)
    .limit(20);

  const cardIds = result.map((row) => row.id);

  const imagesResult = await pokemon
    .select({ cardId: cardImages.cardId, imageType: cardImages.imageType, url: cardImages.url })
    .from(cardImages)
    .where(inArray(cardImages.cardId, cardIds));

  const cardIdToImagesMap = imagesResult.reduce(
    (imageMap, { cardId, imageType, url }) => {
      imageMap[cardId] = imageMap[cardId] ?? {};
      if (imageType === "small" || imageType === "large") {
        imageMap[cardId][imageType] = url;
      }
      return imageMap;
    },
    {} as Record<string, CardImages>,
  );

  return result.map<Card>((card) => ({
    id: card.id,
    name: card.name,
    setName: card.setName,
    finishes: card.rarity === "Rare Holo" ? ["holo"] : [],
    images: cardIdToImagesMap[card.id],
    inventory: createFakeInventory(),
  }));
}

function buildMagicImages(scryfallId: string | null, multiverseId: string | null) {
  return {
    small: scryfallId
      ? buildScryfallImageUrl(scryfallId, "small")
      : multiverseId
        ? buildGathererImageUrl(multiverseId, "small")
        : null,
    large: scryfallId
      ? buildScryfallImageUrl(scryfallId, "large")
      : multiverseId
        ? buildGathererImageUrl(multiverseId, "large")
        : null,
  };
}

function buildScryfallImageUrl(scryfallId: string, type: "small" | "large") {
  const fileFace = "front";
  const fileFormat = "jpg";
  const fileName = scryfallId;
  const dir1 = fileName.charAt(0);
  const dir2 = fileName.charAt(1);
  return `https://cards.scryfall.io/${type}/${fileFace}/${dir1}/${dir2}/${fileName}.${fileFormat}`;
}

function buildGathererImageUrl(multiverseId: string, type: "small" | "large") {
  return `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${multiverseId}&type=${type}`;
}

function createFakeInventory() {
  return {
    NM: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
    LP: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
    MP: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
    HP: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
    D: {
      quantity: Math.floor(Math.random() * 101),
      price: getRandomDollarAmount(1.0, 100.0),
    },
  };
}

function getRandomDollarAmount(min: number, max: number) {
  // Generate a random number between min and max
  let randomNumber = Math.random() * (max - min) + min;
  // Round to two decimal places and convert to a fixed-point string
  return randomNumber.toFixed(2);
}
