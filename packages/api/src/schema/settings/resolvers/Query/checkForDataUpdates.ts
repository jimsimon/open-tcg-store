import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { refreshUpdateStatus } from '../../../../services/tcg-data-update-service';
import type { QueryResolvers } from './../../../types.generated';

export const checkForDataUpdates: NonNullable<QueryResolvers['checkForDataUpdates']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['read'] });
  return await refreshUpdateStatus();
};
