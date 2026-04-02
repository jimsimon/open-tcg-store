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
          organizationId: (session?.session as Record<string, unknown> | undefined)?.activeOrganizationId as string | null ?? null,
          req: req.raw,
          res: req.context.res,
        } as GraphqlContext;
      },
    }),
  ),
);

const router = new Router()
  .get('/graphiql', (ctx: RouterContext) => {
    ctx.status = 200;
    ctx.type = 'html';
    ctx.body = ruruHTML({
      endpoint: '/graphql',
    });
  })
  // OAuth callback routes for backup providers
  .get('/api/backup/oauth/google_drive/authorize', (ctx: RouterContext) => {
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
  .get('/api/backup/oauth/dropbox/authorize', (ctx: RouterContext) => {
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
  .get('/api/backup/oauth/onedrive/authorize', (ctx: RouterContext) => {
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
  });
