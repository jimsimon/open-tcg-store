import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, anonymous, organization } from 'better-auth/plugins';
import { eq, and, sql } from 'drizzle-orm';
import { otcgs } from './db';
import * as schema from './db/otcgs/schema';
import { cart } from './db/otcgs/shopping-schema';
import { ac, roles } from './lib/permissions';

export { ac, roles } from './lib/permissions';

export const auth = betterAuth({
  baseURL: 'http://localhost:5174',
  database: drizzleAdapter(otcgs, {
    provider: 'sqlite',
    schema,
  }),
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? 'http://localhost:5173').split(','),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Auto-set active organization on login if not already set.
          // Find the user's first org membership and set it as active.
          // Uses raw SQL since the `member` table is managed by better-auth
          // and may not be in our Drizzle schema exports.
          if (!(session as Record<string, unknown>).activeOrganizationId) {
            const result = await otcgs.all<{ organizationId: string }>(
              sql`SELECT organization_id as "organizationId" FROM member WHERE user_id = ${session.userId} LIMIT 1`,
            );

            if (result.length > 0) {
              return {
                data: {
                  ...session,
                  activeOrganizationId: result[0].organizationId,
                },
              };
            }
          }
          return { data: session };
        },
      },
    },
  },
  plugins: [
    organization({
      ac,
      roles,
      dynamicAccessControl: { enabled: true },
      schema: {
        organization: {
          additionalFields: {
            street1: { type: 'string', required: true, input: true },
            street2: { type: 'string', required: false, input: true },
            city: { type: 'string', required: true, input: true },
            state: { type: 'string', required: true, input: true },
            zip: { type: 'string', required: true, input: true },
            phone: { type: 'string', required: false, input: true },
          },
        },
      },
    }),
    admin({
      ac,
      roles,
    }),
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        // Transfer shopping carts from anonymous user to the newly signed-in user.
        // This is org-aware: each cart has an organizationId, so we transfer per-org.
        await otcgs.transaction(async (tx) => {
          const anonymousCarts = await tx.select().from(cart).where(eq(cart.userId, anonymousUser.user.id));

          for (const anonymousCart of anonymousCarts) {
            // Check if the authenticated user already has a cart for this org
            const existingCarts = await tx
              .select()
              .from(cart)
              .where(and(eq(cart.userId, newUser.user.id), eq(cart.organizationId, anonymousCart.organizationId)));

            if (existingCarts.length === 0) {
              // No existing cart for this org — transfer the anonymous cart
              await tx.update(cart).set({ userId: newUser.user.id }).where(eq(cart.id, anonymousCart.id));
            }
            // If authenticated user already has a cart for this org, keep theirs
            // (the anonymous cart will be cleaned up by cart expiry)
          }
        });
      },
    }),
  ],
});
