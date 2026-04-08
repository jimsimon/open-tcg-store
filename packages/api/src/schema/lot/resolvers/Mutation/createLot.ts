import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { createLot as createLotService } from '../../../../services/lot-service';
import type { MutationResolvers } from './../../../types.generated';

export const createLot: NonNullable<MutationResolvers['createLot']> = async (_parent, args, ctx: GraphqlContext) => {
  await assertPermission(ctx, { lot: ['create'] });
  const organizationId = getOrganizationId(ctx);
  const userId = getUserId(ctx);
  return await createLotService(organizationId, args.input, userId);
};
