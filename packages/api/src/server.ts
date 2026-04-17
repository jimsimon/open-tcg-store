import { bodyParser } from '@koa/bodyparser';
import Router from '@koa/router';
import type { RouterContext } from '@koa/router';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import Koa from 'koa';
import mount from 'koa-mount';
import koaCors from '@koa/cors';
import { createHandler } from 'graphql-http/lib/use/koa';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './schema/resolvers.generated.ts';
import type { Resolvers } from './schema/types.generated.ts';
import { typeDefs } from './schema/typeDefs.generated.ts';
import { ruruHTML } from 'ruru/server';
import { auth } from './auth.ts';
import type { IncomingMessage } from 'node:http';
import {
  getGoogleDriveAuthUrl,
  handleGoogleDriveCallback,
  getDropboxAuthUrl,
  handleDropboxCallback,
  getOneDriveAuthUrl,
  handleOneDriveCallback,
  validateOAuthState,
} from './services/backup-service.ts';
import { isDatabaseUpdating, otcgs } from './db/otcgs/index.ts';
import { startUpdateScheduler } from './services/tcg-data-update-service.ts';
import { sql } from 'drizzle-orm';
import { rateLimit } from './lib/rate-limit.ts';

export type GraphqlContext = {
  /** The authenticated session, or null if the request is unauthenticated */
  auth: Awaited<ReturnType<typeof auth.api.getSession>> | null;
  /** The active organization (store) ID from the session, or null if not set */
  organizationId: string | null;
  req: IncomingMessage;
  res: import('koa').Response;
};

const app = new Koa();
// Trust X-Forwarded-* headers from the reverse proxy (nginx) so ctx.ip
// returns the real client IP instead of the proxy's address. Required for
// rate limiting to work correctly per-client.
app.proxy = true;

// Global error handler — catch unexpected errors and return a generic 500
// instead of leaking stack traces or internal details.
app.on('error', (err) => {
  console.error('Unhandled server error:', err);
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('Request error:', err);
    ctx.status = 500;
    ctx.body = { error: 'Internal server error' };
  }
});

app.use(
  koaCors({
    credentials: true,
    origin: process.env.APP_URL || 'http://localhost',
  }),
);

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use(async (ctx, next) => {
  ctx.set('X-Content-Type-Options', 'nosniff');
  ctx.set('X-Frame-Options', 'DENY');
  ctx.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  ctx.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  ctx.set('X-XSS-Protection', '0'); // Disabled per OWASP — modern browsers use CSP instead
  return next();
});

// ---------------------------------------------------------------------------
// CSRF protection — validate Origin header on state-changing requests
// ---------------------------------------------------------------------------
const allowedOrigins = new Set(
  (process.env.TRUSTED_ORIGINS ?? process.env.APP_URL ?? 'http://localhost').split(',').map((o) => o.trim()),
);

app.use(async (ctx, next) => {
  // Only validate POST/PUT/PATCH/DELETE — safe methods (GET, HEAD, OPTIONS) are exempt
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.method)) {
    const origin = ctx.get('Origin');
    if (origin) {
      // Origin header present — must match an allowed origin
      if (!allowedOrigins.has(origin)) {
        ctx.status = 403;
        ctx.body = { error: 'Forbidden: Origin not allowed' };
        return;
      }
    } else {
      // Origin absent — fall back to Referer header. HTML form POSTs may omit
      // Origin in some browsers, so we check Referer to prevent cross-origin
      // form submissions carrying the user's session cookie.
      const referer = ctx.get('Referer');
      if (referer) {
        try {
          const refererOrigin = new URL(referer).origin;
          if (!allowedOrigins.has(refererOrigin)) {
            ctx.status = 403;
            ctx.body = { error: 'Forbidden: Origin not allowed' };
            return;
          }
        } catch {
          // Malformed Referer — block the request
          ctx.status = 403;
          ctx.body = { error: 'Forbidden: Invalid Referer' };
          return;
        }
      }
      // Neither Origin nor Referer is present. CSRF protection is only
      // relevant for requests carrying ambient credentials (session cookies).
      // Non-browser clients (curl, Postman, server-to-server) don't send
      // these headers and shouldn't be blocked.
      const hasCookie = ctx.get('Cookie')?.includes('better-auth.session_token');
      if (hasCookie) {
        ctx.status = 403;
        ctx.body = { error: 'Forbidden: Origin or Referer header required for state-changing requests' };
        return;
      }
    }
  }
  return next();
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

// Strict rate limit on auth endpoints (login, signup, password reset)
const authRateLimit = rateLimit({
  max: 20,
  windowMs: 60_000, // 20 requests per minute per IP
  keyFn: (ctx) => `auth:${ctx.ip}`,
  message: 'Too many authentication attempts. Please try again later.',
});

// More generous limit on GraphQL (general API usage)
const graphqlRateLimit = rateLimit({
  max: 200,
  windowMs: 60_000, // 200 requests per minute per IP
  keyFn: (ctx) => `gql:${ctx.ip}`,
  message: 'Too many requests. Please slow down.',
});

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: resolvers as Resolvers,
});

// Return 503 during database updates, except for the status endpoint.
// This intentionally blocks ALL routes including /api/auth — the update
// window is brief (~1s) and allowing auth requests during a database swap
// could cause errors since the auth tables live in the same SQLite file.
app.use(async (ctx, next) => {
  if (isDatabaseUpdating() && ctx.URL.pathname !== '/api/status') {
    ctx.status = 503;
    ctx.body = {
      errors: [{ message: 'The product database is being updated. Please try again in a moment.' }],
    };
    ctx.set('Retry-After', '10');
    return;
  }
  return next();
});

// Apply rate limiting to auth endpoints
app.use(async (ctx, next) => {
  if (ctx.URL.pathname.startsWith('/api/auth')) {
    await authRateLimit(ctx, async () => {
      await toNodeHandler(auth)(ctx.req, ctx.res);
    });
  } else {
    return next();
  }
});
app.use(bodyParser());

// Apply rate limiting to GraphQL endpoint
app.use(async (ctx, next) => {
  if (ctx.URL.pathname === '/graphql') {
    return graphqlRateLimit(ctx, next);
  }
  return next();
});

app.use(
  mount(
    '/graphql',
    createHandler({
      schema,
      context: async (req) => {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.raw.headers),
        });
        return {
          auth: session ?? null,
          organizationId:
            ((session?.session as Record<string, unknown> | undefined)?.activeOrganizationId as string | null) ?? null,
          req: req.raw,
          res: req.context.res,
        } satisfies GraphqlContext;
      },
    }),
  ),
);

/**
 * Verify the current request has an authenticated session with companySettings:update
 * permission. Returns true if authorized, false otherwise (also sets ctx.status = 403).
 */
async function requireCompanySettingsUpdate(ctx: RouterContext): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(ctx.req.headers),
  });
  if (!session?.user) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Authentication required' };
    return false;
  }
  try {
    const result = await auth.api.hasPermission({
      headers: fromNodeHeaders(ctx.req.headers) as unknown as Record<string, string>,
      body: { permissions: { companySettings: ['update'] } },
    });
    if (!result.success) {
      ctx.status = 403;
      ctx.body = { error: 'Forbidden: Insufficient permissions' };
      return false;
    }
  } catch {
    ctx.status = 403;
    ctx.body = { error: 'Forbidden: Insufficient permissions' };
    return false;
  }
  return true;
}

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

/**
 * Verify the current request has an authenticated session with a specific
 * userManagement permission action. Returns the session if authorized, null
 * otherwise (also sets ctx.status = 403).
 */
async function requireUserManagementPermission(
  ctx: RouterContext,
  action: 'create' | 'read' | 'update' | 'delete',
): Promise<AuthSession | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(ctx.req.headers),
  });
  if (!session?.user) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: Authentication required' };
    return null;
  }
  try {
    const result = await auth.api.hasPermission({
      headers: fromNodeHeaders(ctx.req.headers) as unknown as Record<string, string>,
      body: { permissions: { userManagement: [action] } },
    });
    if (!result.success) {
      ctx.status = 403;
      ctx.body = { error: 'Forbidden: Insufficient permissions' };
      return null;
    }
  } catch {
    ctx.status = 403;
    ctx.body = { error: 'Forbidden: Insufficient permissions' };
    return null;
  }
  return session;
}

/** Shorthand for requiring userManagement:update (used by existing endpoints). */
async function requireUserManagementUpdate(ctx: RouterContext): Promise<AuthSession | null> {
  return requireUserManagementPermission(ctx, 'update');
}

/**
 * Look up the requesting user's role in a specific organization.
 * Returns the role string or null if the user is not a member of that org.
 */
async function getRequestingUserRole(userId: string, organizationId: string): Promise<string | null> {
  const rows = await otcgs.all<{ role: string }>(
    sql`SELECT role FROM member WHERE user_id = ${userId} AND organization_id = ${organizationId} LIMIT 1`,
  );
  return rows[0]?.role ?? null;
}

const router = new Router()
  .get('/api/status', (ctx: RouterContext) => {
    ctx.body = { databaseUpdating: isDatabaseUpdating() };
  })
  .get('/graphiql', (ctx: RouterContext) => {
    if (process.env.NODE_ENV === 'production') {
      ctx.status = 404;
      ctx.body = { error: 'Not found' };
      return;
    }
    ctx.status = 200;
    ctx.type = 'html';
    ctx.body = ruruHTML({
      endpoint: '/graphql',
    });
  })
  // OAuth callback routes for backup providers
  // Authorize routes require authentication; callbacks validate the CSRF state parameter.
  .get('/api/backup/oauth/google_drive/authorize', async (ctx: RouterContext) => {
    if (!(await requireCompanySettingsUpdate(ctx))) return;
    ctx.redirect(getGoogleDriveAuthUrl());
  })
  .get('/api/backup/oauth/google_drive/callback', async (ctx: RouterContext) => {
    try {
      if (!(await requireCompanySettingsUpdate(ctx))) return;
      const state = ctx.query.state as string;
      if (!state || validateOAuthState(state) !== 'google_drive') {
        throw new Error('Invalid or expired OAuth state. Please try again.');
      }
      const code = ctx.query.code as string;
      if (!code) throw new Error('No authorization code received');
      await handleGoogleDriveCallback(code);
      ctx.redirect('/settings/backup?connected=google_drive');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth failed';
      ctx.redirect(`/settings/backup?error=${encodeURIComponent(message)}`);
    }
  })
  .get('/api/backup/oauth/dropbox/authorize', async (ctx: RouterContext) => {
    if (!(await requireCompanySettingsUpdate(ctx))) return;
    ctx.redirect(getDropboxAuthUrl());
  })
  .get('/api/backup/oauth/dropbox/callback', async (ctx: RouterContext) => {
    try {
      if (!(await requireCompanySettingsUpdate(ctx))) return;
      const state = ctx.query.state as string;
      if (!state || validateOAuthState(state) !== 'dropbox') {
        throw new Error('Invalid or expired OAuth state. Please try again.');
      }
      const code = ctx.query.code as string;
      if (!code) throw new Error('No authorization code received');
      await handleDropboxCallback(code);
      ctx.redirect('/settings/backup?connected=dropbox');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth failed';
      ctx.redirect(`/settings/backup?error=${encodeURIComponent(message)}`);
    }
  })
  .get('/api/backup/oauth/onedrive/authorize', async (ctx: RouterContext) => {
    if (!(await requireCompanySettingsUpdate(ctx))) return;
    ctx.redirect(getOneDriveAuthUrl());
  })
  .get('/api/backup/oauth/onedrive/callback', async (ctx: RouterContext) => {
    try {
      if (!(await requireCompanySettingsUpdate(ctx))) return;
      const state = ctx.query.state as string;
      if (!state || validateOAuthState(state) !== 'onedrive') {
        throw new Error('Invalid or expired OAuth state. Please try again.');
      }
      const code = ctx.query.code as string;
      if (!code) throw new Error('No authorization code received');
      await handleOneDriveCallback(code);
      ctx.redirect('/settings/backup?connected=onedrive');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth failed';
      ctx.redirect(`/settings/backup?error=${encodeURIComponent(message)}`);
    }
  })
  /**
   * GET /api/users/:userId/store-memberships
   * Returns all store memberships for the given user.
   * Requires userManagement:update permission.
   */
  .get('/api/users/:userId/store-memberships', async (ctx: RouterContext) => {
    if (!(await requireUserManagementUpdate(ctx))) return;
    const { userId } = ctx.params;
    try {
      const rows = await otcgs.all<{ organizationId: string; memberId: string; role: string }>(
        sql`SELECT organization_id as "organizationId", id as "memberId", role FROM member WHERE user_id = ${userId}`,
      );
      ctx.body = rows;
    } catch (error) {
      ctx.status = 500;
      console.error('Failed to fetch memberships:', error);
      ctx.body = { error: 'Failed to fetch memberships' };
    }
  })
  /**
   * POST /api/users/store-membership
   * Adds a user to a store organization.
   * Body: { userId: string, organizationId: string, role: string }
   * Requires userManagement:update permission.
   */
  .post('/api/users/store-membership', async (ctx: RouterContext) => {
    const session = await requireUserManagementUpdate(ctx);
    if (!session) return;
    const body = ctx.request.body as {
      userId?: string;
      organizationId?: string;
      role?: 'owner' | 'manager' | 'member';
    };
    const { userId, organizationId, role } = body;
    if (!userId || !organizationId || !role) {
      ctx.status = 400;
      ctx.body = { error: 'userId, organizationId, and role are required' };
      return;
    }
    // Runtime role validation — only allow known non-owner roles
    const allowedRoles = ['manager', 'member'];
    if (!allowedRoles.includes(role)) {
      ctx.status = 400;
      ctx.body = { error: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` };
      return;
    }
    // Manager guard: verify the requesting user is a member of the target org
    // and restrict managers to only assign the member role.
    const requestingUserRole = await getRequestingUserRole(session.user.id, organizationId);
    if (!requestingUserRole) {
      ctx.status = 403;
      ctx.body = { error: 'You are not a member of this store.' };
      return;
    }
    if (requestingUserRole === 'manager' && role !== 'member') {
      ctx.status = 403;
      ctx.body = { error: 'Managers can only assign the member role.' };
      return;
    }
    try {
      const result = await auth.api.addMember({
        body: { userId, organizationId, role },
      });
      ctx.body = result;
    } catch (error) {
      ctx.status = 500;
      console.error('Failed to add member:', error);
      ctx.body = { error: 'Failed to add member' };
    }
  })
  /**
   * POST /api/users/store-membership/remove
   * Removes a user from a store organization. Uses POST instead of DELETE
   * because some fetch implementations strip the body from DELETE requests.
   * Body: { memberId: string, organizationId: string }
   * Requires userManagement:update permission.
   */
  .post('/api/users/store-membership/remove', async (ctx: RouterContext) => {
    const session = await requireUserManagementUpdate(ctx);
    if (!session) return;
    const body = (ctx.request.body ?? {}) as { memberId?: string; organizationId?: string };
    const { memberId, organizationId } = body;
    if (!memberId || !organizationId) {
      ctx.status = 400;
      ctx.body = { error: 'memberId and organizationId are required' };
      return;
    }
    try {
      // Look up the member being removed to check their role and total store count.
      const rows = await otcgs.all<{ userId: string; role: string; totalMemberships: number }>(
        sql`
          SELECT
            m.user_id AS "userId",
            m.role    AS "role",
            (SELECT COUNT(*) FROM member WHERE user_id = m.user_id) AS "totalMemberships"
          FROM member m
          WHERE m.id = ${memberId}
          LIMIT 1
        `,
      );
      if (rows.length > 0) {
        const { role, totalMemberships } = rows[0];
        if (role === 'owner' && totalMemberships <= 1) {
          ctx.status = 400;
          ctx.body = { error: 'Cannot remove an owner from their last store assignment.' };
          return;
        }
        // Manager guard: verify the requesting user is a member of the target org
        // and restrict managers to only removing standard members. Custom roles may
        // carry elevated permissions set by an owner, so managers cannot touch them.
        const requestingUserRole = await getRequestingUserRole(session.user.id, organizationId);
        if (!requestingUserRole) {
          ctx.status = 403;
          ctx.body = { error: 'You are not a member of this store.' };
          return;
        }
        if (requestingUserRole === 'manager' && role !== 'member') {
          ctx.status = 403;
          ctx.body = { error: 'Managers can only remove standard members from a store.' };
          return;
        }
      }
      // The beforeRemoveMember hook in auth.ts will additionally block any owner removal.
      await auth.api.removeMember({
        headers: fromNodeHeaders(ctx.req.headers) as unknown as Record<string, string>,
        body: { memberIdOrEmail: memberId, organizationId },
      });
      ctx.body = { success: true };
    } catch (error) {
      ctx.status = 500;
      console.error('Failed to remove member:', error);
      ctx.body = { error: 'Failed to remove member' };
    }
  })
  /**
   * POST /api/users/lookup
   * Looks up a single non-anonymous user by email address. Returns minimal
   * user info (id, name, email) for the assign-to-store workflow.
   * Requires userManagement:read permission.
   */
  .post('/api/users/lookup', async (ctx: RouterContext) => {
    if (!(await requireUserManagementPermission(ctx, 'read'))) return;
    const body = ctx.request.body as { email?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email) {
      ctx.status = 400;
      ctx.body = { error: 'Email is required' };
      return;
    }
    try {
      const rows = await otcgs.all<{ id: string; name: string; email: string }>(
        sql`SELECT id, name, email FROM "user" WHERE LOWER(email) = ${email} AND is_anonymous = false LIMIT 1`,
      );
      if (rows.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'No user found with that email address. They may need to sign up first.' };
        return;
      }
      ctx.body = rows[0];
    } catch (error) {
      ctx.status = 500;
      console.error('Failed to look up user:', error);
      ctx.body = { error: 'Failed to look up user' };
    }
  })
  /**
   * GET /api/users/:userId
   * Returns a single non-anonymous user by ID. Used by the user-edit page
   * to load user details without requiring admin plugin access.
   * Requires userManagement:read permission.
   */
  .get('/api/users/:userId', async (ctx: RouterContext) => {
    if (!(await requireUserManagementPermission(ctx, 'read'))) return;
    const { userId } = ctx.params;
    try {
      const rows = await otcgs.all<{
        id: string;
        name: string;
        email: string;
        role: string | null;
        createdAt: string;
      }>(
        sql`SELECT id, name, email, role, created_at AS "createdAt" FROM "user" WHERE id = ${userId} AND is_anonymous = false LIMIT 1`,
      );
      if (rows.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'User not found' };
        return;
      }
      ctx.body = rows[0];
    } catch (error) {
      ctx.status = 500;
      console.error('Failed to fetch user:', error);
      ctx.body = { error: 'Failed to fetch user' };
    }
  });

const port = 5174;
app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(port, () => {
    console.log('Routes:');
    console.log(router.stack.map((i) => i.path));
    console.log(`Server is listening on port ${port}`);

    // Start the tcg-data database update scheduler
    startUpdateScheduler();
  });
