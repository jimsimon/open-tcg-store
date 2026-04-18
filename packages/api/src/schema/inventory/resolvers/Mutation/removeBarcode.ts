import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { removeBarcode as removeBarcodeService } from '../../../../services/barcode-service';
import type { MutationResolvers } from './../../../types.generated';

export const removeBarcode: NonNullable<MutationResolvers['removeBarcode']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['update'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await removeBarcodeService(organizationId, args.input.id, userId);
};
