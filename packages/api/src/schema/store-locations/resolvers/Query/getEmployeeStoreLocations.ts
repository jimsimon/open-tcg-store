import { getUserId } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { getEmployeeStoreLocations as getEmployeeStoreLocationsService } from '../../../../services/store-location-service';
import type { QueryResolvers } from './../../../types.generated';

export const getEmployeeStoreLocations: NonNullable<QueryResolvers['getEmployeeStoreLocations']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  getUserId(ctx);
  return await getEmployeeStoreLocationsService(ctx.req.headers as Record<string, string>);
};
