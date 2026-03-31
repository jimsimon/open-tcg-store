import { GraphqlContext } from '../../../../server';
import { submitOrder as submitOrderService } from '../../../../services/order-service';
import type { MutationResolvers } from './../../../types.generated';

export const submitOrder: NonNullable<MutationResolvers['submitOrder']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  const result = await submitOrderService(ctx.auth.user.id, _arg.input.customerName);
  return result;
};
