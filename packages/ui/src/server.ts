import { bodyParser } from '@koa/bodyparser';
import Router from '@koa/router';
import type { RouterContext } from '@koa/router';
import Koa, { Context, type Next } from 'koa';
import koaConnect from 'koa-connect';
import { createServer as createViteServer } from 'vite';
import viteConfig from '../../../vite.config.ts';
import { execute } from './lib/graphql.ts';
import { graphql } from './graphql/index.ts';
import { authClient } from './auth-client.ts';

type AppState = {
  auth: typeof authClient.$Infer.Session;
};

const app = new Koa<AppState>();

// Create Vite server in middleware mode and configure the app type as
// 'custom', disabling Vite's own HTML serving logic so parent server
// can take control
const vite = await createViteServer(viteConfig);

// Use vite's connect instance as middleware. If you use your own
// express router (express.Router()), you should use router.use
// When the server restarts (for example after the user modifies
// vite.config.js), `vite.middlewares` is still going to be the same
// reference (with a new internal stack of Vite and plugin-injected
// middlewares). The following is valid even after restarts.
app.use(koaConnect(vite.middlewares));
app.use(bodyParser());
app.use(async (ctx, next) => {
  // Check if the user already has a session
  const getSessionResponse = await getSession(ctx);

  if (getSessionResponse.data) {
    ctx.state.auth = getSessionResponse.data;
  }

  await next();
});

function getSession(ctx: Context) {
  return authClient.getSession({
    fetchOptions: {
      headers: {
        // We need to copy over any session cookies from the browser request to the API request
        Cookie: ctx.headers.cookie,
      } as Record<string, string>,
    },
  });
}

/**
 * Creates middleware that checks if the user has a specific permission
 * using authClient.organization.hasPermission, which respects the user's
 * role in their active organization.
 */
function requirePermission(resource: string, action: string) {
  return async (ctx: Context, next: Next) => {
    if (!ctx.state.auth?.user) {
      ctx.status = 403;
      ctx.body = 'Forbidden: Authentication required';
      return;
    }

    const result = await authClient.organization.hasPermission({
      permissions: { [resource]: [action] },
      fetchOptions: {
        headers: {
          Cookie: (ctx.headers.cookie as string) ?? '',
          Origin: (ctx.headers.origin as string) ?? 'http://localhost:5173',
        },
      },
    });

    if (!result.data?.success) {
      ctx.status = 403;
      ctx.body = 'Forbidden: Insufficient permissions';
      return;
    }

    return next();
  };
}

/**
 * Middleware that ensures the user has a session, creating an anonymous one if needed.
 * Used on public-facing pages (e.g. card browsing) where guest users
 * need a session for shopping cart functionality.
 */
async function ensureAnonymousSession(ctx: Context, next: Next) {
  // Already has a session from the global middleware
  if (ctx.state.auth) return next();

  const origin = ctx.headers.origin || `${ctx.protocol}://${ctx.host}`;
  const signInResult = await authClient.signIn.anonymous({
    fetchOptions: {
      headers: {
        Cookie: ctx.headers.cookie,
        Origin: origin,
      } as Record<string, string>,
      onSuccess: (successCtx) => {
        // Copy Set-Cookie headers from the sign-in response to the browser response
        const responseCookies = successCtx.response.headers.getSetCookie();
        for (const cookie of responseCookies) {
          ctx.response.append('Set-Cookie', cookie);
        }

        // Extract name=value pairs from Set-Cookie headers (strip attributes like Path, HttpOnly, etc.)
        const newCookiePairs = responseCookies.map((c: string) => c.split(';')[0]);

        // Build a map of cookie name -> value from the new cookies
        const newCookieMap = new Map<string, string>();
        for (const pair of newCookiePairs) {
          const eqIndex = pair.indexOf('=');
          if (eqIndex !== -1) {
            newCookieMap.set(pair.substring(0, eqIndex), pair.substring(eqIndex + 1));
          }
        }

        // Replace existing cookies with new values, or append new ones
        const existingRequestCookies = ctx.req.headers.cookie;
        if (!existingRequestCookies) {
          ctx.request.headers.cookie = newCookiePairs.join('; ');
        } else {
          // Parse existing cookies and replace any that have new values
          const existingPairs = existingRequestCookies.split(';').map((c) => c.trim());
          const updatedPairs = existingPairs.map((pair) => {
            const eqIndex = pair.indexOf('=');
            if (eqIndex !== -1) {
              const name = pair.substring(0, eqIndex);
              if (newCookieMap.has(name)) {
                const newValue = newCookieMap.get(name);
                newCookieMap.delete(name); // Mark as handled
                return `${name}=${newValue}`;
              }
            }
            return pair;
          });
          // Append any remaining new cookies that weren't replacements
          for (const [name, value] of newCookieMap) {
            updatedPairs.push(`${name}=${value}`);
          }
          ctx.request.headers.cookie = updatedPairs.join('; ');
        }
      },
    },
  });

  if (signInResult.error) {
    console.error('Anonymous sign-in failed:', signInResult.error);
    throw new Error(
      `Anonymous sign-in failed: ${signInResult.error.message ?? signInResult.error.code ?? 'unknown error'}`,
    );
  }

  const getSessionResponse = await getSession(ctx);
  if (!getSessionResponse.data) {
    throw new Error('Failed to retrieve session data after anonymous account creation');
  }
  ctx.state.auth = getSessionResponse.data;
  return next();
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5174';

const router = new Router()
  // Proxy /api/status to the API server so client-side code can use a relative URL
  .get('api-status', '/api/status', async (ctx) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/status`);
      if (!res.ok) {
        ctx.status = res.status;
        ctx.body = { databaseUpdating: false };
        return;
      }
      ctx.body = await res.json();
    } catch {
      ctx.status = 502;
      ctx.body = { databaseUpdating: false };
    }
  })
  .use(async (ctx: RouterContext, next: Next) => {
    if ((await isSetupPending()) && ctx._matchedRouteName !== 'first-time-setup') {
      const redirectUrlOrError = router.url('first-time-setup');
      if (redirectUrlOrError instanceof Error) {
        throw redirectUrlOrError;
      }
      ctx.redirect(redirectUrlOrError);
      return; // Don't continue to route handler after redirect
    }
    return next();
  })
  .use(async (ctx: RouterContext, next: Next) => {
    if ((await isDatabaseUpdating()) && ctx._matchedRouteName !== 'maintenance') {
      const redirectUrlOrError = router.url('maintenance');
      if (redirectUrlOrError instanceof Error) {
        throw redirectUrlOrError;
      }
      ctx.redirect(redirectUrlOrError);
      return;
    }
    return next();
  })
  .get('dashboard', '/', async (ctx) => {
    return renderPage(ctx, 'home');
  })
  .get('first-time-setup', '/first-time-setup', async (ctx) => {
    return renderPage(ctx, 'first-time-setup');
  })
  .get('maintenance', '/maintenance', async (ctx) => {
    return renderPage(ctx, 'maintenance');
  })
  .use('/products', ensureAnonymousSession)
  .get('products-redirect', '/products', async (ctx) => {
    ctx.redirect('/products/singles');
  })
  .get('products-singles', '/products/singles', async (ctx) => {
    return renderPage(ctx, 'products-singles');
  })
  .get('products-sealed', '/products/sealed', async (ctx) => {
    return renderPage(ctx, 'products-sealed');
  })
  .get('product-details', '/products/:productId', async (ctx) => {
    return renderPage(ctx, 'product-details');
  })
  .use('/buy-rates', ensureAnonymousSession)
  .get('buy-rates', '/buy-rates', async (ctx) => {
    return renderPage(ctx, 'buy-rates');
  })
  // Backward-compatible redirects from old card URLs
  .get('cards-redirect', '/games/:game/cards', async (ctx) => {
    const game = ctx.params.game;
    ctx.redirect(`/products/singles?game=${game}`);
  })
  .get('card-details-redirect', '/games/:game/cards/:cardId', async (ctx) => {
    ctx.redirect(`/products/${ctx.params.cardId}`);
  })
  .get('orders', '/orders', async (ctx) => {
    return renderPage(ctx, 'orders');
  })
  .get('transaction-log', '/transaction-log', async (ctx) => {
    await requirePermission('transactionLog', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'transaction-log');
  })
  .get('inventory-redirect', '/inventory', async (ctx) => {
    ctx.redirect('/inventory/singles');
  })
  .get('inventory-singles', '/inventory/singles', async (ctx) => {
    return renderPage(ctx, 'inventory-singles');
  })
  .get('inventory-sealed', '/inventory/sealed', async (ctx) => {
    return renderPage(ctx, 'inventory-sealed');
  })
  .get('inventory-singles-detail', '/inventory/singles/:inventoryItemId', async (ctx) => {
    await requirePermission('inventory', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'inventory-detail');
  })
  .get('inventory-sealed-detail', '/inventory/sealed/:inventoryItemId', async (ctx) => {
    await requirePermission('inventory', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'inventory-detail');
  })
  .get('import-inventory', '/inventory/import', async (ctx) => {
    return renderPage(ctx, 'inventory-import');
  })
  // Settings routes - require storeSettings:read permission
  .use('/settings', requirePermission('storeSettings', 'read'))
  .get('settings-redirect', '/settings', async (ctx) => {
    ctx.redirect('/settings/general');
  })
  .get('settings-general', '/settings/general', async (ctx) => {
    return renderPage(ctx, 'settings-general');
  })
  .get('settings-backup', '/settings/backup', async (ctx) => {
    return renderPage(ctx, 'settings-backup');
  })
  .get('settings-autoprice', '/settings/autoprice', async (ctx) => {
    return renderPage(ctx, 'settings-autoprice');
  })
  .get('settings-buyrates', '/settings/buyrates', async (ctx) => {
    return renderPage(ctx, 'settings-buyrates');
  })
  .get('settings-integrations', '/settings/integrations', async (ctx) => {
    return renderPage(ctx, 'settings-integrations');
  })
  .get('settings-locations', '/settings/locations', async (ctx) => {
    return renderPage(ctx, 'settings-locations');
  })
  .get('settings-users', '/settings/users', async (ctx) => {
    return renderPage(ctx, 'settings-users');
  });

const port = 5173;
app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(port, () => {
    console.log('Routes:');
    console.log(router.stack.map((i) => i.path));
    console.log(`Server is listening on port ${port}`);
  });

async function renderPage(ctx: RouterContext, pageDirectory: string) {
  const { render: renderShellTemplate } = await vite.ssrLoadModule('/packages/ui/src/shell.ts');
  const { render: pageTemplate } = await vite.ssrLoadModule(
    `/packages/ui/src/pages/${pageDirectory}/${pageDirectory}.server.ts`,
  );
  ctx.type = 'html';
  // ctx.body = new RenderResultReadable(
  //   ssrRender(renderShellTemplate(pageDirectory, pageTemplate(ctx))),
  // );
  ctx.body = renderShellTemplate(pageDirectory, await pageTemplate(ctx));
}

async function isDatabaseUpdating(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/status`);
    if (!res.ok) return false;
    const data = (await res.json()) as { databaseUpdating: boolean };
    return data.databaseUpdating === true;
  } catch {
    // If the API is unreachable, don't block the UI with a maintenance page
    return false;
  }
}

async function isSetupPending() {
  try {
    const IsSetupPendingQuery = graphql(`
      query IsSetupPending {
        isSetupPending
      }
    `);

    const result = await execute(IsSetupPendingQuery);

    if (result?.errors?.length) {
      console.error('isSetupPending query errors:', JSON.stringify(result.errors));
      // If we can't determine setup status, assume it IS pending (safer to redirect
      // to setup than to let users through to a broken app with no data)
      return true;
    }

    return result.data.isSetupPending;
  } catch (err) {
    // API server may not be running yet during startup — assume setup is needed
    console.error('isSetupPending check failed:', err);
    return true;
  }
}
