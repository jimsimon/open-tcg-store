import type { GraphqlContext } from '../../../../server';
import { assertAuthenticated } from '../../../../lib/assert-permission';
import { getStoreLocation as getStoreLocationService } from '../../../../services/store-location-service';
import type { QueryResolvers } from './../../../types.generated';

export const getStoreLocation: NonNullable<QueryResolvers['getStoreLocation']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertAuthenticated(ctx);
  return await getStoreLocationService(args.id);
};
