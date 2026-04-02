import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getStoreSettings as getStoreSettingsService } from '../../../../services/settings-service';
import type { QueryResolvers } from './../../../types.generated';

export const getStoreSettings: NonNullable<QueryResolvers['getStoreSettings']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeSettings: ['read'] });
  return await getStoreSettingsService();
};
