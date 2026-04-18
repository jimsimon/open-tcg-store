import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { lookupBarcode as lookupBarcodeService } from '../../../../services/barcode-service';
import type { QueryResolvers } from './../../../types.generated';

export const lookupBarcode: NonNullable<QueryResolvers['lookupBarcode']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { inventory: ['read'] });
  const organizationId = getOrganizationId(ctx);
  return await lookupBarcodeService(organizationId, args.code);
};
