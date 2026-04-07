import type { GraphqlContext } from '../../../../server';
import { assertPermission, getUserId } from '../../../../lib/assert-permission';
import { updateBackupSettings as updateBackupSettingsService } from '../../../../services/settings-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateBackupSettings: NonNullable<MutationResolvers['updateBackupSettings']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const userId = getUserId(ctx);
  return await updateBackupSettingsService(args.input, userId);
};
