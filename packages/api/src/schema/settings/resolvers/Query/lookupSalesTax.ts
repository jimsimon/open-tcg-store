import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { lookupSalesTax as lookupSalesTaxService } from '../../../../services/settings-service';
import type { QueryResolvers } from './../../../types.generated';

export const lookupSalesTax: NonNullable<QueryResolvers['lookupSalesTax']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeSettings: ['read'] });
  return await lookupSalesTaxService(args.countryCode, args.stateCode);
};
