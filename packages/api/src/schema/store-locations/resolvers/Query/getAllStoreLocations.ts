import type { GraphqlContext } from '../../../../server';
import { assertAuthenticated } from '../../../../lib/assert-permission';
import { getAllStoreLocations as getAllStoreLocationsService } from '../../../../services/store-location-service';
import type { QueryResolvers } from './../../../types.generated';

export const getAllStoreLocations: NonNullable<QueryResolvers['getAllStoreLocations']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  assertAuthenticated(ctx);
  return await getAllStoreLocationsService();
};
