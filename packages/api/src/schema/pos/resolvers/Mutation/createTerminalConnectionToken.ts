import type { GraphqlContext } from '../../../../server';
import { assertPermission } from '../../../../lib/assert-permission';
import { createTerminalConnectionToken as createTokenService } from '../../../../services/stripe-payment-service';
import type { MutationResolvers } from './../../../types.generated';

export const createTerminalConnectionToken: NonNullable<MutationResolvers['createTerminalConnectionToken']> = async (
  _parent,
  _args,
  ctx: GraphqlContext,
) => {
  await assertPermission(ctx, { order: ['create'] });
  return await createTokenService();
};
