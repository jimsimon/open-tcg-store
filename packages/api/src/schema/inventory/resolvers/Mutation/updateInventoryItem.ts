import type { GraphqlContext } from "../../../../server";
import { updateInventoryItem as updateInventoryItemService } from "../../../../services/inventory-service";
import type { MutationResolvers } from "./../../../types.generated";

function assertInventoryAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== "admin" && role !== "employee") {
    throw new Error("Unauthorized: Inventory access requires admin or employee role");
  }
}

export const updateInventoryItem: NonNullable<MutationResolvers["updateInventoryItem"]> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertInventoryAccess(ctx);
  const userId = ctx.auth?.user?.id;
  return await updateInventoryItemService(args.input, userId);
};
