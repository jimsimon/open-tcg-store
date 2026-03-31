import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAccessControl } from 'better-auth/plugins/access';
import { admin, anonymous } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import { otcgs } from './db';
import * as schema from './db/otcgs/schema';
import { cart } from './db/otcgs/shopping-schema';

const statement = {
  inventory: ['create', 'read', 'update', 'delete'],
} as const;

export const ac = createAccessControl(statement);

const adminRole = ac.newRole({
  inventory: ['create', 'read', 'update', 'delete'],
});

const employeeRole = ac.newRole({
  inventory: ['create', 'read', 'update', 'delete'],
});

export const roles = {
  admin: adminRole,
  employee: employeeRole,
};

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
  plugins: [
    admin({
      ac,
      roles,
    }),
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        // Transfer shopping cart from anonymous user to the newly signed-in user
        await otcgs.transaction(async (tx) => {
          const anonymousCarts = await tx.select().from(cart).where(eq(cart.userId, anonymousUser.user.id));

          for (const anonymousCart of anonymousCarts) {
            await tx.update(cart).set({ userId: newUser.user.id }).where(eq(cart.id, anonymousCart.id));
          }
        });
      },
    }),
  ],
});
