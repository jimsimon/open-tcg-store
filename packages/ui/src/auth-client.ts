import { createAuthClient } from 'better-auth/client';
import { adminClient, anonymousClient, organizationClient } from 'better-auth/client/plugins';
import { ac, roles } from '../../api/src/lib/permissions';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:5174',
  plugins: [
    organizationClient({
      ac,
      roles,
      dynamicAccessControl: { enabled: true },
    }),
    adminClient({
      ac,
      roles,
    }),
    anonymousClient(),
  ],
});
