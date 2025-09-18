import { bodyParser } from "@koa/bodyparser";
import Router from "@koa/router";
import type { RouterContext } from "@koa/router";
import Koa, { Context, type Next } from "koa";
import koaConnect from "koa-connect";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../../vite.config.ts";
import { execute } from "./lib/graphql.ts";
import { graphql } from "./graphql/index.ts";
import { authClient } from "./auth-client.ts";

type GetSessionReturnType = ReturnType<typeof authClient.getSession>;
type GetSessionResponse = Awaited<ReturnType<typeof authClient.getSession>>;

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
  // First, check to see if the user has a session
  let getSessionResponse = await getSession(ctx);

  // No session was found, so we need to create an anonymous one
  if (!getSessionResponse.data) {
    await authClient.signIn.anonymous({
      fetchOptions: createSignInFetchOptions(ctx, next),
    });
    getSessionResponse = await getSession(ctx);
    if (!getSessionResponse.data) {
      throw new Error("Failed to retrieve session data after anonymous account creation");
    }
    ctx.state.auth = getSessionResponse.data;
  } else {
    ctx.state.auth = getSessionResponse.data;
    await next();
  }
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

function createSignInFetchOptions(ctx: Context, next: Next) {
  return {
    onResponse: async ({ response }: { response: Response }) => {
      for (const cookie of response.headers.getSetCookie()) {
        // Copy over any auth cookies from the API response to the response we're about to send to the browser
        ctx.response.append("Set-Cookie", cookie);
        // Also copy the cookies over to the current request for future auth calls
      }
      const existingRequestCookies = ctx.req.headers.cookie;
      const newResponseCookies = response.headers.get("Set-Cookie") ?? undefined;
      if (!existingRequestCookies) {
        ctx.request.headers.cookie = newResponseCookies;
      } else {
        ctx.request.headers.cookie = `${existingRequestCookies}; ${newResponseCookies}`;
      }
      await next();
    },
  };
}

const router = new Router()
  .use(async (ctx: RouterContext, next: Next) => {
    if ((await isSetupPending()) && ctx._matchedRouteName !== "first-time-setup") {
      const redirectUrlOrError = router.url("first-time-setup");
      if (redirectUrlOrError instanceof Error) {
        throw redirectUrlOrError;
      }
      ctx.redirect(redirectUrlOrError);
    }
    return next();
  })
  .get("dashboard", "/", async (ctx) => {
    return renderPage(ctx, "home");
  })
  .get("first-time-setup", "/first-time-setup", async (ctx) => {
    return renderPage(ctx, "first-time-setup");
  })
  .get("inventory", "/games/:game/cards", async (ctx) => {
    return renderPage(ctx, "cards");
  })
  .get("card-details", "/games/:game/cards/:cardId", async (ctx) => {
    return renderPage(ctx, "card-details");
  })
  .get("sales", "/sales", async (ctx) => {
    return renderPage(ctx, "sales");
  })
  .get("settings", "/settings", async (ctx) => {
    return renderPage(ctx, "settings");
  });

const port = 5173;
app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(port, () => {
    console.log("Routes:");
    console.log(router.stack.map((i) => i.path));
    console.log(`Server is listening on port ${port}`);
  });

async function renderPage(ctx: RouterContext, pageDirectory: string) {
  const { render: renderShellTemplate } = await vite.ssrLoadModule("/packages/ui/src/shell.ts");
  const { render: pageTemplate } = await vite.ssrLoadModule(
    `/packages/ui/src/pages/${pageDirectory}/${pageDirectory}.server.ts`,
  );
  ctx.type = "html";
  // ctx.body = new RenderResultReadable(
  //   ssrRender(renderShellTemplate(pageDirectory, pageTemplate(ctx))),
  // );
  ctx.body = renderShellTemplate(pageDirectory, pageTemplate(ctx));
}

async function isSetupPending() {
  const IsSetupPendingQuery = graphql(`
    query IsSetupPending {
      isSetupPending
    }
  `);

  const result = await execute(IsSetupPendingQuery);

  if (result?.errors?.length) {
    console.log({ result });
  } else {
    return result.data.isSetupPending;
  }
}
