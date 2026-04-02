import type { GraphqlContext } from '../../../../server';
import { getAllStoreLocations as getAllStoreLocationsService } from '../../../../services/store-location-service';
import type { QueryResolvers } from './../../../types.generated';

export const getAllStoreLocations: NonNullable<QueryResolvers['getAllStoreLocations']> = async (
  _parent,
  _arg,
  _ctx: GraphqlContext,
) => {
  return await getAllStoreLocationsService();
};
