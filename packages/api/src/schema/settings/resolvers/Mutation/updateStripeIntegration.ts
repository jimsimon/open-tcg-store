import type { GraphqlContext } from '../../../../server';
import { updateStripeIntegration as updateStripeService } from '../../../../services/settings-service';
import type { MutationResolvers } from './../../../types.generated';

function assertAdminAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin') {
    throw new Error('Unauthorized: Settings access requires admin role');
  }
}

export const updateStripeIntegration: NonNullable<MutationResolvers['updateStripeIntegration']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertAdminAccess(ctx);
  const userId = ctx.auth?.user?.id;
  return await updateStripeService(args.input, userId);
};
