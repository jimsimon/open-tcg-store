import { getOrganizationId, getUserId } from '../../../../lib/assert-permission';
import { NotImplementedError } from '../../../../lib/errors';
import type { MutationResolvers } from './../../../types.generated';

export const checkoutWithCart: NonNullable<MutationResolvers['checkoutWithCart']> = async (_parent, _arg, ctx) => {
  // Verify authentication before returning the error so unauthenticated users
  // get a 401 rather than a misleading "not implemented" message.
  getOrganizationId(ctx);
  getUserId(ctx);
  throw new NotImplementedError('Checkout is not yet implemented. Please check back later.');
};
