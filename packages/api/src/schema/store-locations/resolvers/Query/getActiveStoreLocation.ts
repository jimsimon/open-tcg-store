import type { GraphqlContext } from '../../../../server';
import { getActiveStoreLocation as getActiveStoreLocationService } from '../../../../services/store-location-service';
import type { QueryResolvers } from './../../../types.generated';

export const getActiveStoreLocation: NonNullable<QueryResolvers['getActiveStoreLocation']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  return await getActiveStoreLocationService(ctx.req.headers as Record<string, string>);
};
