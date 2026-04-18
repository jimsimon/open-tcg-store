import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { cancelPaymentIntent } from '../../../../services/stripe-payment-service';
import type { MutationResolvers } from './../../../types.generated';

export const cancelPosPaymentIntent: NonNullable<MutationResolvers['cancelPosPaymentIntent']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['create'] });
  return await cancelPaymentIntent(args.paymentIntentId);
};
