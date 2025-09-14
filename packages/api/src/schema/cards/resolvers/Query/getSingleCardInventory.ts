import { eq, like, sql, and } from "drizzle-orm";
import { magic, pokemon } from "../../../../db";
import { cardIdentifiers, cards as mtgCards, sets as mtgSets } from "../../../../db/mtg/schema";
import { Card, InputMaybe, SingleCardFilters, type QueryResolvers } from "../../../types.generated";
import { buildMagicImages, createFakeInventory } from "./utils";
import { normalize } from "better-auth";

interface MtgCardPricing {
  meta: {
    date: string;
    version: string;
  };
  data: Record<string, PriceFormats>;
}

interface PriceFormats {
  mtgo?: Record<"cardhoarder", PriceList>;
  paper?: Record<"cardkingdom" | "cardmarket" | "cardsphere" | "tcgplayer", PriceList>;
}

interface PriceList {
  buylist?: PricePoints;
  currency: string;
  retail?: PricePoints;
}

interface PricePoints {
  etched?: Record<string, number>;
  foil?: Record<string, number>;
  normal?: Record<string, number>;
}

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
    .limit(10);

  const cards = [];
  for (const card of result) {
    for (const finish of (card.finishes || "nonfoil").split(", ")) {
      cards.push({
        id: card.uuid,
        name: card.name || "Unknown Card",
        finishes: [finish],
        setName: card.setName || "Unknown Set",
        images: buildMagicImages(card.scryfallId, card.multiverseId),
        inventory: await createFakeMtgInventory(card.uuid, finish),
      });
    }
  }
  return cards;
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
    limit: 10,
  });

  return result.map<Card>((card) => ({
    id: card.id,
    name: card.name,
    setName: card.set?.name ?? "Unknown Set",
    finishes: card.rarity === "Rare Holo" ? ["holo"] : [],
    images: card.images.reduce(
      (map, { imageType, url }) => {
        map[imageType] = url;
        return map;
      },
      {} as Record<string, string>,
    ),
    inventory: createFakeInventory(),
  }));
}

async function createFakeMtgInventory(cardId: string, finish: string) {
  const type = finish === "nonfoil" ? "normal" : finish;
  const price = await getPriceForIso8601Date(cardId, type);
  return {
    NM: {
      quantity: Math.floor(Math.random() * 101),
      price,
    },
    LP: {
      quantity: Math.floor(Math.random() * 101),
      price: 0,
    },
    MP: {
      quantity: Math.floor(Math.random() * 101),
      price: 0,
    },
    HP: {
      quantity: Math.floor(Math.random() * 101),
      price: 0,
    },
    D: {
      quantity: Math.floor(Math.random() * 101),
      price: 0,
    },
  };
}

async function getPriceForIso8601Date(cardId: string, type: string, date?: string) {
  if (type !== "normal" && type !== "foil" && type !== "etched") {
    return 0;
  }

  const cardPricing = (
    await import("../../../../../../../sqlite-data/mtg-prices-daily.json", {
      with: { type: "json" },
    })
  ).default as MtgCardPricing;

  const retailTypePricing = cardPricing?.data?.[cardId]?.paper?.tcgplayer?.retail?.[type];
  const latestDate = Object.keys(retailTypePricing || {})?.[0];
  const dateToUse = date ?? latestDate;
  const price = retailTypePricing?.[dateToUse] || 0;
  return price;
}
