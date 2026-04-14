import { otcgs } from '../../../../db';
import { likeEscaped } from '../../../../lib/sql-utils';
import type { QueryResolvers } from '../../../types.generated';

export const getSets: NonNullable<QueryResolvers['getSets']> = async (_parent, { game, filters }, _ctx) => {
  const cat = await otcgs.query.category.findFirst({
    columns: { id: true },
    where: (c, { eq }) => eq(c.name, game),
  });

  if (!cat) {
    throw new Error(`Unsupported game: ${game}`);
  }

  const categoryId = cat.id;

  const results = await otcgs.query.group.findMany({
    columns: {
      id: true,
      name: true,
    },
    where: (group, { and, eq, sql }) =>
      and(
        eq(group.categoryId, categoryId),
        filters?.searchTerm && filters.searchTerm.trim().length > 0
          ? likeEscaped(sql`lower(${group.name})`, filters.searchTerm.toLowerCase())
          : undefined,
      ),
    orderBy: (group, { asc }) => asc(group.name),
  });

  return results.map((group) => ({
    code: group.id.toString(),
    name: group.name,
  }));
};
