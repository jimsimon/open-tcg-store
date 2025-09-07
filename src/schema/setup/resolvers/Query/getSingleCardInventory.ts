import { eq, like, sql, and } from "drizzle-orm";
import { mtg } from "../../../../db";
import { cardIdentifiers, cards, sets } from "../../../../db/mtg/schema";
import { Card, type QueryResolvers } from "./../../../types.generated";

export const getSingleCardInventory: NonNullable<QueryResolvers['getSingleCardInventory']> = async (_parent, { filters }, _ctx) => {
  const result = await mtg
    .select({
      uuid: cards.uuid,
      name: cards.name,
      finishes: cards.finishes,
      setName: sets.name,
      scryfallId: cardIdentifiers.scryfallId,
      multiverseId: cardIdentifiers.multiverseId,
    })
    .from(cards)
    .innerJoin(cardIdentifiers, eq(cards.uuid, cardIdentifiers.uuid))
    .innerJoin(sets, eq(cards.setCode, sets.code))
    .where(
      and(
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? like(sql`lower(${cards.name})`, `%${filters.searchTerm.toLowerCase()}%`)
          : undefined,
        filters?.setCode ? eq(sets.code, filters.setCode) : undefined
      )
    )
    .orderBy(cards.name)
    .limit(20);

  return result.map<Card>((card) => ({
    id: card.uuid,
    name: card.name ?? "Unknown Card",
    finishes: card.finishes?.split(", ") ?? [],
    setName: card.setName ?? "Unknown Set",
    thumbnail: card.scryfallId
      ? buildScryfallImageUrl(card.scryfallId)
      : card.multiverseId
        ? buildGathererImageUrl(card.multiverseId)
        : null,
    inventory: {
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
    },
  }));
};

function buildScryfallImageUrl(scryfallId: string) {
  const fileFace = "front";
  const fileType = "small";
  const fileFormat = "jpg";
  const fileName = scryfallId;
  const dir1 = fileName.charAt(0);
  const dir2 = fileName.charAt(1);
  return `https://cards.scryfall.io/${fileType}/${fileFace}/${dir1}/${dir2}/${fileName}.${fileFormat}`;
}

function buildGathererImageUrl(multiverseId: string) {
  const fileType = "small";
  return `https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${multiverseId}&type=${fileType}`;
}

function getRandomDollarAmount(min: number, max: number) {
  // Generate a random number between min and max
  let randomNumber = Math.random() * (max - min) + min;
  // Round to two decimal places and convert to a fixed-point string
  return randomNumber.toFixed(2);
}
