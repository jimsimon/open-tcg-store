import { assertPermission } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { getBackupSettings } from '../../../../services/settings-service';
import { performBackup } from '../../../../services/backup-service';
import type { MutationResolvers } from './../../../types.generated';

export const triggerBackup: NonNullable<MutationResolvers['triggerBackup']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });

  const settings = await getBackupSettings();
  if (!settings.provider) {
    return { success: false, message: 'No backup provider configured', timestamp: new Date().toISOString() };
  }

  return await performBackup(settings.provider as 'google_drive' | 'dropbox' | 'onedrive');
};
