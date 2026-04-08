import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { updateLot as updateLotService } from '../../../../services/lot-service';
import type { MutationResolvers } from './../../../types.generated';

export const updateLot: NonNullable<MutationResolvers['updateLot']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { lot: ['update'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await updateLotService(args.input, userId, organizationId);
};
