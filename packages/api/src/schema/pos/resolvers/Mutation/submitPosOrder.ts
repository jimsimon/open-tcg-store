import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { submitPosOrder as submitPosOrderService } from '../../../../services/pos-service';
import type { MutationResolvers } from './../../../types.generated';

export const submitPosOrder: NonNullable<MutationResolvers['submitPosOrder']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['create'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await submitPosOrderService(
    organizationId,
    {
      customerName: args.input.customerName,
      items: args.input.items,
      taxAmount: args.input.taxAmount,
      paymentMethod: args.input.paymentMethod,
      stripePaymentIntentId: args.input.stripePaymentIntentId ?? undefined,
    },
    userId,
  );
};
