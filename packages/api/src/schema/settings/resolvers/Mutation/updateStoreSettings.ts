import type { GraphqlContext } from '../../../../server';
import { assertPermission, getUserId } from '../../../../lib/assert-permission';
import { updateStoreSettings as updateStoreSettingsService } from '../../../../services/settings-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateStoreSettings: NonNullable<MutationResolvers['updateStoreSettings']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeSettings: ['update'] });
  const userId = getUserId(ctx);
  return await updateStoreSettingsService(args.input, userId);
};
