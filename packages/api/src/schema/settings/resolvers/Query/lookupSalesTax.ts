import type { GraphqlContext } from '../../../../server';
import { lookupSalesTax as lookupSalesTaxService } from '../../../../services/settings-service';
import type { QueryResolvers } from './../../../types.generated';

function assertAdminAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin') {
    throw new Error('Unauthorized: Settings access requires admin role');
  }
}

export const lookupSalesTax: NonNullable<QueryResolvers['lookupSalesTax']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertAdminAccess(ctx);
  return await lookupSalesTaxService(args.countryCode, args.stateCode);
};
