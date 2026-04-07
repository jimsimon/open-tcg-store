import { getUserId } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { setActiveStore } from '../../../../services/store-location-service';
import type { MutationResolvers } from './../../../types.generated';

export const setActiveStoreLocation: NonNullable<MutationResolvers['setActiveStoreLocation']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  getUserId(ctx);
  await setActiveStore(args.organizationId, ctx.req.headers as Record<string, string>);
  return true;
};
