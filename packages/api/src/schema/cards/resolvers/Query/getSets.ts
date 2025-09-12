import type { QueryResolvers } from "../../../types.generated";
import { magic, pokemon } from "../../../../db";
import { sets as magicSets } from "../../../../db/mtg/schema";
import { sets as pokemonSets } from "../../../../db/pokemon/schema";
import { like, sql } from "drizzle-orm";

export const getSets: NonNullable<QueryResolvers['getSets']> = async (_parent, { game, filters }, _ctx) => {
  if (game === "magic") {
    const result = await magic
      .select({ code: magicSets.code, name: magicSets.name })
      .from(magicSets)
      .where(
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? like(sql`lower(${magicSets.name})`, `%${filters.searchTerm.toLowerCase()}%`)
          : undefined,
      )
      .orderBy(magicSets.name);

    return result.map((set) => ({
      code: set.code,
      name: set.name ?? "Unknown Set",
    }));
  } else if (game === "pokemon") {
    const result = await pokemon
      .select({ code: pokemonSets.id, name: pokemonSets.name })
      .from(pokemonSets)
      .where(
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? like(sql`lower(${pokemonSets.name})`, `%${filters.searchTerm.toLowerCase()}%`)
          : undefined,
      )
      .orderBy(pokemonSets.name);

    return result.map((set) => ({
      code: set.code,
      name: set.name ?? "Unknown Set",
    }));
  }

  throw new Error(`Unsupported game: ${game}`);
};
