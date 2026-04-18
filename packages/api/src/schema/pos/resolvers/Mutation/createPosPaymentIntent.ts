import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { createPaymentIntent } from '../../../../services/stripe-payment-service';
import type { MutationResolvers } from './../../../types.generated';

// TODO: When Stripe Elements integration is completed, validate that args.amount
// matches the server-computed order total (line items + tax) instead of trusting
// the client-provided amount. A malicious client could create a PaymentIntent for
// an arbitrary amount. Compute the total server-side from the line items or accept
// line item IDs + quantities instead of a raw amount.
export const createPosPaymentIntent: NonNullable<MutationResolvers['createPosPaymentIntent']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['create'] });
  return await createPaymentIntent(args.amount);
};
