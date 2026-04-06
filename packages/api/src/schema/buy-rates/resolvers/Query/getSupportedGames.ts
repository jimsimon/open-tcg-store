import type { GraphqlContext } from '../../../../server';
import { assertPermission, getOrganizationId } from '../../../../lib/assert-permission';
import { getSupportedGames as getSupportedGamesService } from '../../../../services/buy-rate-service';
import type { QueryResolvers } from './../../../types.generated';

export const getSupportedGames: NonNullable<QueryResolvers['getSupportedGames']> = async (
  _parent,
  _arg,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { storeSettings: ['read'] });
  const orgId = getOrganizationId(ctx);
  return await getSupportedGamesService(orgId);
};
