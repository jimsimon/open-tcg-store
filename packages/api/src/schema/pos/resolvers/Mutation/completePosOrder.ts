import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { completePosOrder as completePosOrderService } from '../../../../services/pos-service';
import type { MutationResolvers } from './../../../types.generated';

export const completePosOrder: NonNullable<MutationResolvers['completePosOrder']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['update'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await completePosOrderService(
    organizationId,
    {
      orderId: args.input.orderId,
      newItems: args.input.newItems ?? undefined,
      taxAmount: args.input.taxAmount,
      paymentMethod: args.input.paymentMethod,
      stripePaymentIntentId: args.input.stripePaymentIntentId ?? undefined,
    },
    userId,
  );
};
