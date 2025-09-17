import { otcgs } from "../../../../db";
import type { QueryResolvers } from "../../../types.generated";

export const getSets: NonNullable<QueryResolvers['getSets']> = async (_parent, { game, filters }, _ctx) => {
  let categoryId;
  if (game === "magic") {
    categoryId = 1;
  } else if (game === "pokemon") {
    categoryId = 2;
  } else {
    throw new Error(`Unsupported game: ${game}`);
  }

  const results = await otcgs.query.group.findMany({
    columns: {
      id: true,
      name: true,
    },
    where: (group, { and, eq, like, sql }) =>
      and(
        eq(group.categoryId, categoryId),
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? like(sql`lower(${group.name})`, `%${filters.searchTerm.toLowerCase()}%`)
          : undefined,
      ),
    orderBy: (group, { asc }) => asc(group.name),
  });

  return results.map((group) => ({
    code: group.id.toString(),
    name: group.name,
  }));
};
