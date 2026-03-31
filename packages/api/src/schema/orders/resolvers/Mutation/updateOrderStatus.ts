import { updateOrderStatus as updateOrderStatusService } from "../../../../services/order-service";
import type { MutationResolvers } from "./../../../types.generated";

export const updateOrderStatus: NonNullable<MutationResolvers["updateOrderStatus"]> = async (_parent, _arg, _ctx) => {
  return updateOrderStatusService(_arg.orderId, _arg.status);
};
