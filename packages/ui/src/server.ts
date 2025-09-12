import { bodyParser } from "@koa/bodyparser";
import Router from "@koa/router";
import type { RouterContext } from "@koa/router";
import Koa, { type Next } from "koa";
import koaConnect from "koa-connect";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../../vite.config.ts";
import { execute } from "./lib/graphql.ts";
import { graphql } from "./graphql/index.ts";

const app = new Koa();

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
