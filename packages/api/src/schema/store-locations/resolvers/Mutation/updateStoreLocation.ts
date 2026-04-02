import { assertPermission } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { updateStoreLocation as updateStoreLocationService } from '../../../../services/store-location-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateStoreLocation: NonNullable<MutationResolvers['updateStoreLocation']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeLocations: ['update'] });
  return await updateStoreLocationService(args.input, ctx.req.headers as Record<string, string>);
};
