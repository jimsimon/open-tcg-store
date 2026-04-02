import { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { updateOrderStatus as updateOrderStatusService } from '../../../../services/order-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateOrderStatus: NonNullable<MutationResolvers['updateOrderStatus']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['update'] });
  return updateOrderStatusService(_arg.orderId, _arg.status);
};
