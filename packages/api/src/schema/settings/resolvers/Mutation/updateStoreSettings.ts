import type { GraphqlContext } from '../../../../server';
import { updateStoreSettings as updateStoreSettingsService } from '../../../../services/settings-service';
import type { MutationResolvers } from './../../../types.generated';

function assertAdminAccess(ctx: GraphqlContext) {
  const role = ctx.auth?.user?.role;
  if (role !== 'admin') {
    throw new Error('Unauthorized: Settings access requires admin role');
  }
}

export const updateStoreSettings: NonNullable<MutationResolvers['updateStoreSettings']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  assertAdminAccess(ctx);
  const userId = ctx.auth?.user?.id;
  return await updateStoreSettingsService(args.input, userId);
};
