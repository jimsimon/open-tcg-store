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
} from './services/backup-service.ts';
import { isDatabaseUpdating } from './db/otcgs/index.ts';
import { startUpdateScheduler } from './services/tcg-data-update-service.ts';

export type GraphqlContext = {
  auth: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  /** The active organization (store) ID from the session, or null if not set */
  organizationId: string | null;
  req: IncomingMessage;
  res: import('koa').Response;
};

const app = new Koa();
app.use(
  koaCors({
    credentials: true,
    origin: 'http://localhost:5173',
  }),
);
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

app.use(async (ctx, next) => {
  if (ctx.URL.pathname.startsWith('/api/auth')) {
    await toNodeHandler(auth)(ctx.req, ctx.res);
  } else {
    return next();
  }
});
app.use(bodyParser());
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
          auth: session,
          organizationId:
            ((session?.session as Record<string, unknown> | undefined)?.activeOrganizationId as string | null) ?? null,
          req: req.raw,
          res: req.context.res,
        } as GraphqlContext;
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
    ctx.status = 403;
    ctx.body = { error: 'Forbidden: Authentication required' };
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

const router = new Router()
  .get('/api/status', (ctx: RouterContext) => {
    ctx.body = { databaseUpdating: isDatabaseUpdating() };
  })
  .get('/graphiql', (ctx: RouterContext) => {
    ctx.status = 200;
    ctx.type = 'html';
    ctx.body = ruruHTML({
      endpoint: '/graphql',
    });
  })
  // OAuth callback routes for backup providers
  .get('/api/backup/oauth/google_drive/authorize', async (ctx: RouterContext) => {
    if (!(await requireCompanySettingsUpdate(ctx))) return;
    ctx.redirect(getGoogleDriveAuthUrl());
  })
  .get('/api/backup/oauth/google_drive/callback', async (ctx: RouterContext) => {
    try {
      const code = ctx.query.code as string;
      if (!code) throw new Error('No authorization code received');
      await handleGoogleDriveCallback(code);
      ctx.redirect('http://localhost:5173/settings/backup?connected=google_drive');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth failed';
      ctx.redirect(`http://localhost:5173/settings/backup?error=${encodeURIComponent(message)}`);
    }
  })
  .get('/api/backup/oauth/dropbox/authorize', async (ctx: RouterContext) => {
    if (!(await requireCompanySettingsUpdate(ctx))) return;
    ctx.redirect(getDropboxAuthUrl());
  })
  .get('/api/backup/oauth/dropbox/callback', async (ctx: RouterContext) => {
    try {
      const code = ctx.query.code as string;
      if (!code) throw new Error('No authorization code received');
      await handleDropboxCallback(code);
      ctx.redirect('http://localhost:5173/settings/backup?connected=dropbox');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth failed';
      ctx.redirect(`http://localhost:5173/settings/backup?error=${encodeURIComponent(message)}`);
    }
  })
  .get('/api/backup/oauth/onedrive/authorize', async (ctx: RouterContext) => {
    if (!(await requireCompanySettingsUpdate(ctx))) return;
    ctx.redirect(getOneDriveAuthUrl());
  })
  .get('/api/backup/oauth/onedrive/callback', async (ctx: RouterContext) => {
    try {
      const code = ctx.query.code as string;
      if (!code) throw new Error('No authorization code received');
      await handleOneDriveCallback(code);
      ctx.redirect('http://localhost:5173/settings/backup?connected=onedrive');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OAuth failed';
      ctx.redirect(`http://localhost:5173/settings/backup?error=${encodeURIComponent(message)}`);
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
