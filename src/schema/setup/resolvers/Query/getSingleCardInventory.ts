import { eq, like, sql } from "drizzle-orm";
import { mtg } from "../../../../db";
import { cardIdentifiers, cards } from "../../../../db/mtg/schema";
import { Card, type QueryResolvers } from "./../../../types.generated";

export const getSingleCardInventory: NonNullable<
  QueryResolvers["getSingleCardInventory"]
> = async (_parent, { searchTerm }, _ctx) => {
  const result = await mtg
    .select({
      uuid: cards.uuid,
      name: cards.name,
      scryfallId: cardIdentifiers.scryfallId,
      multiverseId: cardIdentifiers.multiverseId,
    })
    .from(cards)
    .innerJoin(cardIdentifiers, eq(cards.uuid, cardIdentifiers.uuid))
    .where(
      searchTerm && searchTerm.trim().length > 0
        ? like(sql`lower(${cards.name})`, `%${searchTerm.toLowerCase()}%`)
        : undefined,
    )
    .limit(20);

  return result.map<Card>((card) => ({
    id: card.uuid,
    name: card.name ?? "Unknown Card",
    thumbnail: card.scryfallId
      ? buildScryfallImageUrl(card.scryfallId)
      : card.multiverseId
        ? buildGathererImageUrl(card.multiverseId)
        : null,
    inventory: [
      {
        condition: "Near Mint",
        quantity: Math.floor(Math.random() * 101),
        price: getRandomDollarAmount(1.0, 100.0),
      },
      {
        condition: "Lightly Played",
        quantity: Math.floor(Math.random() * 101),
        price: getRandomDollarAmount(1.0, 100.0),
      },
      {
        condition: "Moderately Played",
        quantity: Math.floor(Math.random() * 101),
        price: getRandomDollarAmount(1.0, 100.0),
      },
      {
        condition: "Heavily Played",
        quantity: Math.floor(Math.random() * 101),
        price: getRandomDollarAmount(1.0, 100.0),
      },
      {
        condition: "Damaged",
        quantity: Math.floor(Math.random() * 101),
        price: getRandomDollarAmount(1.0, 100.0),
      },
    ],
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
