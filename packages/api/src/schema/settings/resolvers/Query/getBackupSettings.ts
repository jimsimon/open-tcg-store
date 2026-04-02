import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { getBackupSettings as getBackupSettingsService } from '../../../../services/settings-service';
import type { QueryResolvers } from './../../../types.generated';

export const getBackupSettings: NonNullable<QueryResolvers['getBackupSettings']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeSettings: ['read'] });
  return await getBackupSettingsService();
};
