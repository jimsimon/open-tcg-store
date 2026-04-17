import type { MutationResolvers } from '../../../types.generated.ts';
import { performFirstTimeSetup } from '../../../../services/setup-service.ts';
import type { GraphqlContext } from '../../../../server.ts';
import { RateLimitStore } from '../../../../lib/rate-limit.ts';

// Strict rate limit for setup attempts — 5 per IP per hour
const setupRateLimiter = new RateLimitStore({ max: 5, windowMs: 60 * 60 * 1000 });

export const firstTimeSetup: NonNullable<MutationResolvers['firstTimeSetup']> = async (
  _parent,
  args,
  ctx: GraphqlContext,
) => {
  // Rate-limit setup attempts per client IP
  const clientIp = ctx.req.socket?.remoteAddress ?? 'unknown';
  const result = setupRateLimiter.check(`setup:${clientIp}`);
  if (!result.allowed) {
    throw new Error('Too many setup attempts. Please try again later.');
  }

  return await performFirstTimeSetup(
    {
      email: args.userDetails.email,
      password: args.userDetails.password,
      firstName: args.userDetails.firstName,
    },
    {
      companyName: args.company.companyName,
      ein: args.company.ein,
    },
    {
      name: args.store.name,
      slug: args.store.slug,
      street1: args.store.street1,
      street2: args.store.street2,
      city: args.store.city,
      state: args.store.state,
      zip: args.store.zip,
      phone: args.store.phone,
    },
    args.supportedGameCategoryIds,
    ctx.req,
    (cookie: string) => ctx.res.append('Set-Cookie', cookie),
  );
};
