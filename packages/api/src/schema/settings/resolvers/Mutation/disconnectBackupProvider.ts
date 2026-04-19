import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { clearOAuthTokens, getBackupSettings } from '../../../../services/settings-service';
import type { MutationResolvers } from './../../../types.generated';

export const disconnectBackupProvider: NonNullable<MutationResolvers['disconnectBackupProvider']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  await clearOAuthTokens(args.provider as 'google_drive' | 'dropbox' | 'onedrive');
  return await getBackupSettings();
};
