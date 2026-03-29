import { sql } from "drizzle-orm";
import { otcgs } from "../../../../db";
import { productExtendedData } from "../../../../db/tcg-data/schema";
import { Card, InputMaybe, SingleCardFilters, type QueryResolvers } from "../../../types.generated";
import { createFakeInventory } from "./utils";

export const getSingleCardInventory: NonNullable<QueryResolvers["getSingleCardInventory"]> = async (
  _parent,
  { game, filters },
  _ctx,
) => {
  try {
    if (game === "magic") {
      return await getInventory(1, filters);
    } else if (game === "pokemon") {
      return await getInventory(2, filters);
    }
  } catch (e) {
    console.error(e);
  }

  throw new Error(`Unsupported game: ${game}`);
};

async function getInventory(categoryId: number, filters: InputMaybe<SingleCardFilters>) {
  const includeSingles = filters?.includeSingles;
  const includeSealed = filters?.includeSealed;

  const results = await otcgs.query.product.findMany({
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
    },
    where: (product, { and, like, eq, exists }) =>
      and(
        eq(product.categoryId, categoryId),
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? like(sql`lower(${product.name})`, `%${filters.searchTerm.toLowerCase()}%`)
          : undefined,
        filters?.setCode ? eq(product.groupId, parseInt(filters.setCode, 10)) : undefined,
        // Product type filtering: singles vs sealed
        includeSingles === true && includeSealed !== true
          ? exists(
              otcgs
                .select({ one: sql`1` })
                .from(productExtendedData)
                .where(
                  and(
                    eq(productExtendedData.productId, product.id),
                    sql`(${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')`,
                  ),
                ),
            )
          : undefined,
        includeSealed === true && includeSingles !== true
          ? sql`NOT EXISTS (
              SELECT 1 FROM ${productExtendedData}
              WHERE ${productExtendedData.productId} = ${product.id}
                AND (${productExtendedData.name} = 'Rarity' OR ${productExtendedData.name} = 'Number')
            )`
          : undefined,
      ),
    orderBy: (product, { asc }) => asc(product.name),
    limit: 10,
  });

  const cards: Card[] = [];
  for (const result of results) {
    for (const { marketPrice, midPrice, subTypeName } of result.prices) {
      cards.push({
        id: result.id.toString(),
        name: result.name,
        finishes: [subTypeName],
        setName: result.group?.name || "Unknown Set",
        images: {
          small: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_200x200.jpg`,
          large: `https://tcgplayer-cdn.tcgplayer.com/product/${result.tcgpProductId}_in_1000x1000.jpg`,
        },
        inventory: [
          {
            type: subTypeName,
            ...createFakeInventory(marketPrice, midPrice),
          },
        ],
      });
    }
  }
  return cards;
}
