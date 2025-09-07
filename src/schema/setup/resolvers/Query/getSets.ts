import type { QueryResolvers } from "./../../../types.generated";
import { mtg } from "../../../../db";
import { sets } from "../../../../db/mtg/schema";
import { like, sql } from "drizzle-orm";

export const getSets: NonNullable<QueryResolvers["getSets"]> = async (
  _parent,
  { filters },
  _ctx,
) => {
  const result = await mtg
    .select({ code: sets.code, name: sets.name })
    .from(sets)
    .where(
      filters?.searchTerm && filters.searchTerm.trim().length > 0
        ? like(
            sql`lower(${sets.name})`,
            `%${filters.searchTerm.toLowerCase()}%`,
          )
        : undefined,
    )
    .orderBy(sets.name);

  return result.map((set) => ({
    code: set.code,
    name: set.name ?? "Unknown Set",
  }));
};
