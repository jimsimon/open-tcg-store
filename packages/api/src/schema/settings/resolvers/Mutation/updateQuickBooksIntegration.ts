import { assertPermission } from '../../../../lib/assert-permission';
import type { GraphqlContext } from '../../../../server';
import { updateQuickBooksIntegration as updateQuickBooksService } from '../../../../services/settings-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateQuickBooksIntegration: NonNullable<MutationResolvers['updateQuickBooksIntegration']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeSettings: ['update'] });
  const userId = ctx.auth?.user?.id;
  return await updateQuickBooksService(args.input, userId);
};
