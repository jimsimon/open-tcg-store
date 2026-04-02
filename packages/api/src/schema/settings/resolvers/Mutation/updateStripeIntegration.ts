import { assertPermission } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { updateStripeIntegration as updateStripeService } from '../../../../services/settings-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateStripeIntegration: NonNullable<MutationResolvers['updateStripeIntegration']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeSettings: ['update'] });
  const userId = ctx.auth?.user?.id;
  return await updateStripeService(args.input, userId);
};
