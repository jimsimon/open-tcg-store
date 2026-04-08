import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { deleteLot as deleteLotService } from '../../../../services/lot-service';
import type { MutationResolvers } from './../../../types.generated';

export const deleteLot: NonNullable<MutationResolvers['deleteLot']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { lot: ['delete'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await deleteLotService(args.id, organizationId, userId);
};
