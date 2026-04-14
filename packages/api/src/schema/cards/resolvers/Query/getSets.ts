import { resolveCategoryId, getSets as getSetsService } from '../../../../services/card-service';
import type { QueryResolvers } from '../../../types.generated';

export const getSets: NonNullable<QueryResolvers['getSets']> = async (_parent, { game, filters }, _ctx) => {
  const categoryId = await resolveCategoryId(game);
  return await getSetsService(categoryId, filters);
};
