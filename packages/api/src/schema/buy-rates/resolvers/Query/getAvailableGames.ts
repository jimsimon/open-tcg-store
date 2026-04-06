import { getAvailableGames as getAvailableGamesService } from '../../../../services/buy-rate-service';
import type { QueryResolvers } from './../../../types.generated';

export const getAvailableGames: NonNullable<QueryResolvers['getAvailableGames']> = async () => {
  // Public query - no auth required (TCG catalog data is not sensitive)
  return await getAvailableGamesService();
};
