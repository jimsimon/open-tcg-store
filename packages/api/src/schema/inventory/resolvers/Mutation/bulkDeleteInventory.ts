import type { GraphqlContext } from "../../../../server";
import { bulkDeleteInventoryItems } from "../../../../services/inventory-service";
import type { MutationResolvers } from "./../../../types.generated";

function assertInventoryAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== "admin" && role !== "employee") {
    throw new Error("Unauthorized: Inventory access requires admin or employee role");
  }
}

export const bulkDeleteInventory: NonNullable<MutationResolvers["bulkDeleteInventory"]> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertInventoryAccess(ctx);
  return await bulkDeleteInventoryItems(args.input.ids);
};
