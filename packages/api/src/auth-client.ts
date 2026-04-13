import { createAuthClient } from 'better-auth/client';
import { adminClient, anonymousClient } from 'better-auth/client/plugins';
import { ac, roles } from './auth';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost',
  plugins: [
    adminClient({
      ac,
      roles,
    }),
    anonymousClient(),
  ],
});
