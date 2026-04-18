import { bodyParser } from '@koa/bodyparser';
import Router from '@koa/router';
import type { RouterContext } from '@koa/router';
import Koa, { Context, type Next } from 'koa';
import koaConnect from 'koa-connect';
import { execute } from './lib/graphql.ts';
import { graphql } from './graphql/index.ts';
import { authClient } from './auth-client.ts';
import { RateLimitStore } from './lib/rate-limit-store.ts';

const isProd = process.env.NODE_ENV === 'production';

// Hoisted to module scope to avoid re-parsing on every call
const IsSetupPendingQuery = graphql(`
  query IsSetupPending {
    isSetupPending
  }
`);

type AppState = {
  auth: typeof authClient.$Infer.Session;
};

const app = new Koa<AppState>();

// Global error handler — prevent stack traces from leaking to clients
app.on('error', (err) => {
  console.error('Unhandled UI server error:', err);
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('UI request error:', err);
    ctx.status = 500;
    ctx.body = 'Internal server error';
  }
});

// ---------------------------------------------------------------------------
// Dev vs. Production mode
// ---------------------------------------------------------------------------
// In development, Vite serves assets and provides HMR. In production, static
// assets are served from the pre-built dist directory and SSR templates are
// loaded directly via dynamic import instead of vite.ssrLoadModule().

let vite: Awaited<ReturnType<typeof import('vite').createServer>> | null = null;

if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const viteConfig = (await import('../../../vite.config.ts')).default;
  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  vite = await createViteServer(viteConfig);
  // Use vite's connect instance as middleware for HMR and asset serving.
  app.use(koaConnect(vite.middlewares));
} else {
  // In production, static assets are served by a reverse proxy (nginx) or CDN.
  // The Node server only handles SSR page rendering and API proxying.
}
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
 * Checks if the current user has a specific permission
 * using authClient.organization.hasPermission, which respects the user's
 * role in their active organization.
 */
async function hasPermission(ctx: Context, resource: string, action: string): Promise<boolean> {
  if (!ctx.state.auth?.user) return false;

  try {
    const result = await authClient.organization.hasPermission({
      permissions: { [resource]: [action] },
      fetchOptions: {
        headers: {
          Cookie: (ctx.headers.cookie as string) ?? '',
          Origin: (ctx.headers.origin as string) ?? (process.env.APP_URL || 'http://localhost'),
        },
      },
    });

    return result.data?.success === true;
  } catch {
    return false;
  }
}

/**
 * Creates middleware that requires the user to have a specific permission.
 * Returns 403 if the user is not authenticated or lacks the permission.
 */
function requirePermission(resource: string, action: string) {
  return async (ctx: Context, next: Next) => {
    if (await hasPermission(ctx, resource, action)) {
      return next();
    }

    ctx.status = 403;
    ctx.body = ctx.state.auth?.user ? 'Forbidden: Insufficient permissions' : 'Forbidden: Authentication required';
  };
}

/**
 * Middleware that ensures the user has a session, creating an anonymous one if needed.
 * Used on public-facing pages (e.g. card browsing) where guest users
 * need a session for shopping cart functionality.
 */
// Rate limit anonymous session creation — max 30 per IP per minute
const anonSessionLimiter = new RateLimitStore({ max: 30, windowMs: 60_000 });

async function ensureAnonymousSession(ctx: Context, next: Next) {
  // Already has a session from the global middleware
  if (ctx.state.auth) return next();

  // Rate limit anonymous session creation per IP
  const result = anonSessionLimiter.check(ctx.ip);
  if (!result.allowed) {
    ctx.status = 429;
    ctx.body = 'Too many requests. Please try again later.';
    return;
  }

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

const API_INTERNAL_URL = process.env.API_INTERNAL_URL || 'http://localhost:5174';

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
  .get('root', '/', async (ctx) => {
    // Owners → settings dashboard; everyone else → product browsing
    const isOwner = await hasPermission(ctx, 'companySettings', 'read');
    if (isOwner) {
      ctx.redirect('/settings-dashboard');
    } else {
      ctx.redirect('/products/singles');
    }
  })
  .get('settings-dashboard', '/settings-dashboard', async (ctx) => {
    await requirePermission('companySettings', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'settings-dashboard');
  })
  .get('first-time-setup', '/first-time-setup', async (ctx) => {
    if (!(await isSetupPending())) {
      ctx.redirect('/');
      return;
    }
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
  // Public events page (anonymous access)
  .use('/events', ensureAnonymousSession)
  .get('events', '/events', async (ctx) => {
    return renderPage(ctx, 'events');
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
    await requirePermission('order', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'orders');
  })
  .get('pos', '/pos', async (ctx) => {
    await requirePermission('order', 'create')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'pos');
  })
  // Event management (admin - requires event:read permission)
  .get('event-management', '/event-management', async (ctx) => {
    await requirePermission('event', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'event-management');
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
    await requirePermission('inventory', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'inventory-singles');
  })
  .get('inventory-sealed', '/inventory/sealed', async (ctx) => {
    await requirePermission('inventory', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
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
    await requirePermission('inventory', 'create')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'inventory-import');
  })
  // Lot routes
  .get('lots', '/lots', async (ctx) => {
    await requirePermission('lot', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'lots');
  })
  .get('lot-new', '/lots/new', async (ctx) => {
    await requirePermission('lot', 'create')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'lot');
  })
  .get('lot-detail', '/lots/:lotId', async (ctx) => {
    await requirePermission('lot', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'lot');
  })
  // User management routes - require userManagement permission
  .get('users', '/users', async (ctx) => {
    await requirePermission('userManagement', 'read')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'settings-users');
  })
  .get('user-edit', '/users/:userId', async (ctx) => {
    await requirePermission('userManagement', 'update')(ctx, async () => {});
    if (ctx.status === 403) return;
    return renderPage(ctx, 'settings-user-edit');
  })
  // Settings routes - require companySettings:read permission
  .use('/settings', requirePermission('companySettings', 'read'))
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
  .get('settings-data-updates', '/settings/data-updates', async (ctx) => {
    return renderPage(ctx, 'settings-data-updates');
  })
  .get('settings-integrations', '/settings/integrations', async (ctx) => {
    return renderPage(ctx, 'settings-integrations');
  })
  .get('settings-locations', '/settings/locations', async (ctx) => {
    return renderPage(ctx, 'settings-locations');
  })
  .get('settings-scheduled-tasks', '/settings/scheduled-tasks', async (ctx) => {
    return renderPage(ctx, 'settings-scheduled-tasks');
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

/**
 * Render a page by loading its server template module.
 *
 * **SSR architecture note**: Full Lit SSR rendering (via `@lit-labs/ssr`)
 * is intentionally disabled. The server-side `.server.ts` templates return
 * raw HTML strings (with injected data attributes for client hydration)
 * rather than Lit `TemplateResult` objects. The Lit SSR `ssrRender` path
 * is commented out below — enabling it would require server templates to
 * return `TemplateResult` and all components to support declarative shadow
 * DOM. The current approach was chosen for simplicity and to avoid SSR
 * hydration mismatch issues with Web Awesome components. Client-side `.client.ts`
 * components fully render once hydrated and use GraphQL for data operations.
 */
async function renderPage(ctx: RouterContext, pageDirectory: string) {
  let renderShellTemplate: (dir: string, content: unknown) => string;
  let pageTemplate: (ctx: RouterContext) => Promise<string> | string;

  if (vite) {
    // Development: use Vite's module loader for HMR support
    const shellModule = await vite.ssrLoadModule('/packages/ui/src/shell.ts');
    renderShellTemplate = shellModule.render;
    const pageModule = await vite.ssrLoadModule(`/packages/ui/src/pages/${pageDirectory}/${pageDirectory}.server.ts`);
    pageTemplate = pageModule.render;
  } else {
    // Production: use standard dynamic import on pre-built modules
    const shellModule = await import('./shell.ts');
    renderShellTemplate = shellModule.render;
    const pageModule = await import(`./pages/${pageDirectory}/${pageDirectory}.server.ts`);
    pageTemplate = pageModule.render;
  }

  ctx.type = 'html';
  // Full Lit SSR (disabled — see architecture note in git history):
  ctx.body = renderShellTemplate(pageDirectory, await pageTemplate(ctx));
}

// Cache for isDatabaseUpdating — short TTL since updates are brief but we
// don't want to hit the API on every single page navigation.
let dbUpdatingCache: { value: boolean; expiresAt: number } | null = null;
const DB_UPDATING_TTL_MS = 2_000; // 2 seconds

async function isDatabaseUpdating(): Promise<boolean> {
  const now = Date.now();
  if (dbUpdatingCache && now < dbUpdatingCache.expiresAt) {
    return dbUpdatingCache.value;
  }
  try {
    const res = await fetch(`${API_INTERNAL_URL}/api/status`);
    if (!res.ok) return false;
    const data = (await res.json()) as { databaseUpdating: boolean };
    const value = data.databaseUpdating === true;
    dbUpdatingCache = { value, expiresAt: now + DB_UPDATING_TTL_MS };
    return value;
  } catch {
    // If the API is unreachable, don't block the UI with a maintenance page
    return false;
  }
}

// Cache for isSetupPending — once setup is complete, it stays complete forever.
// We cache `false` (setup done) indefinitely but re-check `true` (setup pending)
// with a 30-second TTL so the app detects setup completion within half a minute.
let setupPendingCache: { value: boolean; expiresAt: number } | null = null;
const SETUP_PENDING_TTL_MS = 30_000; // 30 seconds when pending

async function isSetupPending() {
  const now = Date.now();
  if (setupPendingCache && now < setupPendingCache.expiresAt) {
    return setupPendingCache.value;
  }

  try {
    const result = await execute(IsSetupPendingQuery);

    if (result?.errors?.length) {
      console.error('isSetupPending query errors:', JSON.stringify(result.errors));
      return true;
    }

    const pending = result.data.isSetupPending;
    // Cache indefinitely if setup is complete (it won't become pending again);
    // cache with short TTL if still pending so we detect completion promptly.
    setupPendingCache = {
      value: pending,
      expiresAt: pending ? now + SETUP_PENDING_TTL_MS : Number.MAX_SAFE_INTEGER,
    };
    return pending;
  } catch (err) {
    // API server may not be running yet during startup — assume setup is needed
    console.error('isSetupPending check failed:', err);
    return true;
  }
}
