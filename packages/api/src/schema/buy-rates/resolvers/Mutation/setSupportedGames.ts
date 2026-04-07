import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { setSupportedGames as setSupportedGamesService } from '../../../../services/buy-rate-service';
import type { MutationResolvers } from './../../../types.generated';

export const setSupportedGames: NonNullable<MutationResolvers['setSupportedGames']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { companySettings: ['update'] });
  const orgId = getOrganizationId(ctx);
  return await setSupportedGamesService(orgId, args.categoryIds);
};
