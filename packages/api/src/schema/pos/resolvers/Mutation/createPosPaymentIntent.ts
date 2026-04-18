import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { createPaymentIntent } from '../../../../services/stripe-payment-service';
import type { MutationResolvers } from './../../../types.generated';

export const createPosPaymentIntent: NonNullable<MutationResolvers['createPosPaymentIntent']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['create'] });
  return await createPaymentIntent(args.amount);
};
