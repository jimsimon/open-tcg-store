import { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { cancelOrder as cancelOrderService } from '../../../../services/order-service';
import type { MutationResolvers } from './../../../types.generated';

export const cancelOrder: NonNullable<MutationResolvers['cancelOrder']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['cancel'] });
  return cancelOrderService(_arg.orderId);
};
