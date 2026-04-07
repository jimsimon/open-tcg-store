import { assertPermission } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { updateShopifyIntegration as updateShopifyService } from '../../../../services/settings-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateShopifyIntegration: NonNullable<MutationResolvers['updateShopifyIntegration']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const userId = ctx.auth?.user?.id;
  return await updateShopifyService(args.input, userId);
};
