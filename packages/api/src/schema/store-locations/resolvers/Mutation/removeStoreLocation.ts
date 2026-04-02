import { assertPermission } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { removeStoreLocation as removeStoreLocationService } from '../../../../services/store-location-service';
import type { MutationResolvers } from './../../../types.generated';

export const removeStoreLocation: NonNullable<MutationResolvers['removeStoreLocation']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeLocations: ['delete'] });
  return await removeStoreLocationService(args.id, ctx.req.headers as Record<string, string>);
};
