import type { GraphqlContext } from '../../../../server';
import { performRestore } from '../../../../services/backup-service';
import type { MutationResolvers } from './../../../types.generated';

function assertAdminAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin') {
    throw new Error('Unauthorized: Settings access requires admin role');
  }
}

export const triggerRestore: NonNullable<MutationResolvers['triggerRestore']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertAdminAccess(ctx);
  return await performRestore(args.provider as 'google_drive' | 'dropbox' | 'onedrive');
};
