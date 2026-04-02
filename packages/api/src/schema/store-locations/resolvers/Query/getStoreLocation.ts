import type { GraphqlContext } from '../../../../server';
import { getStoreLocation as getStoreLocationService } from '../../../../services/store-location-service';
import type { QueryResolvers } from './../../../types.generated';

export const getStoreLocation: NonNullable<QueryResolvers['getStoreLocation']> = async (
  _parent,
  args,
  _ctx: GraphqlContext,
) => {
  return await getStoreLocationService(args.id);
};
