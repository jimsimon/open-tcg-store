import { getPublicBuyRates as getPublicBuyRatesService } from '../../../../services/buy-rate-service';
import type { QueryResolvers } from './../../../types.generated';

export const getPublicBuyRates: NonNullable<QueryResolvers['getPublicBuyRates']> = async () => {
  return await getPublicBuyRatesService();
};
