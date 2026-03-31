import { cancelOrder as cancelOrderService } from '../../../../services/order-service';
import type { MutationResolvers } from './../../../types.generated';

export const cancelOrder: NonNullable<MutationResolvers['cancelOrder']> = async (_parent, _arg, _ctx) => {
  return cancelOrderService(_arg.orderId);
};
