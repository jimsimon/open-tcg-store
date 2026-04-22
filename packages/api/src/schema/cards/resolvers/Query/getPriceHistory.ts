import type { QueryResolvers } from '../../../types.generated';
import { getPriceHistory as getPriceHistoryService } from '../../../../services/card-service';

export const getPriceHistory: NonNullable<QueryResolvers['getPriceHistory']> = async (_parent, args, _ctx) => {
  const productId = parseInt(args.productId, 10);
  if (isNaN(productId)) throw new Error('Invalid productId');

  return await getPriceHistoryService(productId, args.subTypeName, args.startDate, args.endDate);
};
