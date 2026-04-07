import { auth } from '../auth';
import type { GraphqlContext } from '../server';

/**
 * Get the active organization ID from the GraphQL context.
 * Throws if the user has no active organization set.
 */
export function getOrganizationId(ctx: GraphqlContext): string {
  const orgId = (ctx.auth?.session as Record<string, unknown>)?.activeOrganizationId as string | undefined;
  if (!orgId) {
    throw new Error('No active organization. Please select a store first.');
  }
  return orgId;
}

/**
 * Get the authenticated user's ID from the GraphQL context.
 * Throws if the user is not authenticated.
 */
export function getUserId(ctx: GraphqlContext): string {
  const userId = ctx.auth?.user?.id;
  if (!userId) {
    throw new Error('Unauthorized: Authentication required');
  }
  return userId;
}

/**
 * Try to get the active organization ID from context, returning null if not available.
 * Useful for public-facing queries that should work with or without an org context.
 */
export function getOrganizationIdOptional(ctx: GraphqlContext): string | null {
  return ((ctx.auth?.session as Record<string, unknown>)?.activeOrganizationId as string | null) ?? null;
}

/**
 * Asserts that the current user has the given permissions in their active organization.
 * Uses better-auth's `hasPermission` API for server-side, async permission checks
 * that properly resolve dynamic roles.
 *
 * @param ctx - The GraphQL context containing auth session and request headers
 * @param permissions - A record of resource names to arrays of required actions.
 *   Example: `{ inventory: ['create'], companySettings: ['read'] }`
 *
 * @throws Error if the user doesn't have the required permissions
 */
export async function assertPermission(ctx: GraphqlContext, permissions: Record<string, string[]>): Promise<void> {
  if (!ctx.auth?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const result = await auth.api.hasPermission({
      headers: ctx.req.headers as Record<string, string>,
      body: { permissions },
    });

    if (!result.success) {
      throw new Error('Unauthorized: Insufficient permissions');
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Unauthorized')) {
      throw err;
    }
    // hasPermission can fail if no active org is set — treat as unauthorized
    throw new Error('Unauthorized: No active organization or insufficient permissions');
  }
}
