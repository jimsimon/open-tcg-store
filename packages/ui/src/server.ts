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
 * Creates middleware that checks if the user has a specific permission.
 *
 * During the migration period, we derive permissions from the global user.role
 * field since the organization-based hasPermission() requires an active org
 * which may not be set yet (e.g. if the user just signed in before org auto-select
 * takes effect, or if the better-auth session cache doesn't include the org yet).
 *
 * Once all users are fully migrated to org-based roles, this should use
 * authClient.organization.hasPermission() instead.
 */
function requirePermission(resource: string, action: string) {
  return async (ctx: Context, next: Next) => {
    if (!ctx.state.auth?.user) {
      ctx.status = 403;
      ctx.body = 'Forbidden: Authentication required';
      return;
    }

    const userRole = ctx.state.auth.user.role;

    // Derive permissions from role during migration period.
    // owner/admin get full access, admin (store manager) gets read access to settings,
    // member/employee gets inventory/order access only.
    const permissionMap: Record<string, Record<string, string[]>> = {
      storeSettings: { read: ['admin', 'owner'], update: ['admin', 'owner'] },
      storeLocations: { read: ['admin', 'owner'], create: ['admin', 'owner'], update: ['admin', 'owner'], delete: ['admin', 'owner'] },
      userManagement: { read: ['admin', 'owner'], create: ['admin', 'owner'], update: ['admin', 'owner'], delete: ['admin', 'owner'] },
      inventory: { read: ['admin', 'owner', 'employee', 'member'], create: ['admin', 'owner', 'employee', 'member'], update: ['admin', 'owner', 'employee', 'member'], delete: ['admin', 'owner', 'employee', 'member'] },
      order: { read: ['admin', 'owner', 'employee', 'member'], create: ['admin', 'owner', 'employee', 'member'], update: ['admin', 'owner', 'employee', 'member'], cancel: ['admin', 'owner', 'employee', 'member'] },
    };

    const allowedRoles = permissionMap[resource]?.[action] ?? [];
    if (!userRole || !allowedRoles.includes(userRole)) {
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

const router = new Router()
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
  .get('dashboard', '/', async (ctx) => {
    return renderPage(ctx, 'home');
  })
  .get('first-time-setup', '/first-time-setup', async (ctx) => {
    return renderPage(ctx, 'first-time-setup');
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
  ctx.body = renderShellTemplate(pageDirectory, pageTemplate(ctx));
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
