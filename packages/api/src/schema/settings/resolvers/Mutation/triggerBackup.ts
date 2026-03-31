import type { GraphqlContext } from '../../../../server';
import { getBackupSettings } from '../../../../services/settings-service';
import { performBackup } from '../../../../services/backup-service';
import type { MutationResolvers } from './../../../types.generated';

function assertAdminAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin') {
    throw new Error('Unauthorized: Settings access requires admin role');
  }
}

export const triggerBackup: NonNullable<MutationResolvers['triggerBackup']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  assertAdminAccess(ctx);

  const settings = await getBackupSettings();
  if (!settings.provider) {
    return { success: false, message: 'No backup provider configured', timestamp: new Date().toISOString() };
  }

  return await performBackup(settings.provider as 'google_drive' | 'dropbox' | 'onedrive');
};
