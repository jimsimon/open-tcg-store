import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { triggerManualUpdate } from '../../../../services/tcg-data-update-service';
import type { MutationResolvers } from './../../../types.generated';

export const triggerDataUpdate: NonNullable<MutationResolvers['triggerDataUpdate']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  return await triggerManualUpdate();
};
