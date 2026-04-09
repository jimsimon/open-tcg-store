import { getSupportedGames as getSupportedGamesService } from '../../../../services/buy-rate-service';
import type { QueryResolvers } from './../../../types.generated';

export const getSupportedGames: NonNullable<QueryResolvers['getSupportedGames']> = async () => {
  return await getSupportedGamesService();
};
