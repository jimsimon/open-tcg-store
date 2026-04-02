import { assertPermission } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { addStoreLocation as addStoreLocationService } from '../../../../services/store-location-service';
import type { MutationResolvers } from './../../../types.generated';

export const addStoreLocation: NonNullable<MutationResolvers['addStoreLocation']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeLocations: ['create'] });
  return await addStoreLocationService(args.input, ctx.req.headers as Record<string, string>);
};
