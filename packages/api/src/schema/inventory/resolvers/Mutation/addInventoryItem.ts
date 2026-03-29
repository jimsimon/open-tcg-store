import type { GraphqlContext } from "../../../../server";
import { addInventoryItem as addInventoryItemService } from "../../../../services/inventory-service";
import type { MutationResolvers } from "./../../../types.generated";

function assertInventoryAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== "admin" && role !== "employee") {
    throw new Error("Unauthorized: Inventory access requires admin or employee role");
  }
}

export const addInventoryItem: NonNullable<MutationResolvers["addInventoryItem"]> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertInventoryAccess(ctx);
  const userId = ctx.auth?.user?.id;
  return await addInventoryItemService(args.input, userId);
};
