import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { addBarcode as addBarcodeService } from '../../../../services/barcode-service';
import type { MutationResolvers } from './../../../types.generated';

export const addBarcode: NonNullable<MutationResolvers['addBarcode']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { inventory: ['update'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await addBarcodeService(organizationId, args.input.inventoryItemId, args.input.code, userId);
};
