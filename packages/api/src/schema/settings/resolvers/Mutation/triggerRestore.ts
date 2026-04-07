import { assertPermission } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { performRestore } from '../../../../services/backup-service';
import type { MutationResolvers } from './../../../types.generated';

export const triggerRestore: NonNullable<MutationResolvers['triggerRestore']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  return await performRestore(args.provider as 'google_drive' | 'dropbox' | 'onedrive');
};
