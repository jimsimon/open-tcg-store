import path from "node:path";
import { fileURLToPath } from "node:url";
import { bodyParser } from "@koa/bodyparser";
import Router from "@koa/router";
import type { RouterContext } from "@koa/router";
import { render as ssrRender } from "@lit-labs/ssr/index.js";
import { RenderResultReadable } from "@lit-labs/ssr/lib/render-result-readable.js";
import { toNodeHandler } from "better-auth/node";
import { count } from "drizzle-orm";
import { globSync } from "glob";
import Koa, { type Next } from "koa";
import koaConnect from "koa-connect";
import { createServer as createViteServer } from "vite";
import { user } from "../src/db/auth-schema.ts";
import { db } from "../src/db/index.ts";
import { auth } from "./auth";
import mount from "koa-mount";
import { createHandler } from "graphql-http/lib/use/koa";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { resolvers } from "./schema/resolvers.generated.ts";
import type { Resolvers } from "./schema/types.generated.ts";
import { typeDefs } from "./schema/typeDefs.generated.ts";
import { ruruHTML } from "ruru/server";

const app = new Koa();
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: resolvers as Resolvers,
});
app.use(mount("/graphql", createHandler({ schema })));

// Create Vite server in middleware mode and configure the app type as
// 'custom', disabling Vite's own HTML serving logic so parent server
// can take control
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
  build: {
    rollupOptions: {
      input: {
        ...Object.fromEntries(
          globSync("pages/**/*.client.ts").map((file) => [
            // This removes `src/` as well as the file extension from each
            // file, so e.g. src/nested/foo.js becomes nested/foo
            path.relative(
              "src",
              file.slice(0, file.length - path.extname(file).length),
            ),
            // This expands the relative paths to absolute paths, so e.g.
            // src/nested/foo becomes /project/src/nested/foo.js
            fileURLToPath(new URL(file, import.meta.url)),
          ]),
        ),
      },
    },
  },
  optimizeDeps: {
    exclude: ["lit", "lit-html"],
  },
});

// Use vite's connect instance as middleware. If you use your own
// express router (express.Router()), you should use router.use
// When the server restarts (for example after the user modifies
// vite.config.js), `vite.middlewares` is still going to be the same
// reference (with a new internal stack of Vite and plugin-injected
// middlewares). The following is valid even after restarts.
app.use(koaConnect(vite.middlewares));
app.use(async (ctx, next) => {
  if (ctx.URL.pathname.startsWith("/api/auth")) {
    await toNodeHandler(auth)(ctx.req, ctx.res);
  } else {
    return next();
  }
});
app.use(bodyParser());

const router = new Router()
  .use(async (ctx: RouterContext, next: Next) => {
    const [{ count: userCount }] = await db
      .select({ count: count() })
      .from(user);
    if (userCount === 0 && ctx._matchedRouteName !== "first-time-setup") {
      const redirectUrlOrError = router.url("first-time-setup");
      if (redirectUrlOrError instanceof Error) {
        throw redirectUrlOrError;
      }
      ctx.redirect(redirectUrlOrError);
    }
    return next();
  })
  .get("/graphiql", (ctx: RouterContext) => {
    ctx.status = 200;
    ctx.type = "html";
    ctx.body = ruruHTML({
      endpoint: "/graphql",
    });
  })
  .get("dashboard", "/", async (ctx) => {
    return renderPage(ctx, "home");
  })
  .get("first-time-setup", "/first-time-setup", async (ctx) => {
    return renderPage(ctx, "first-time-setup");
  })
  .get("inventory", "/inventory", async (ctx) => {
    return renderPage(ctx, "inventory");
  })
  .get("sales", "/sales", async (ctx) => {
    return renderPage(ctx, "sales");
  })
  .get("settings", "/settings", async (ctx) => {
    return renderPage(ctx, "settings");
  })

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
  const { render: renderShellTemplate } = await vite.ssrLoadModule(
    "/src/shell.ts",
  );
  const { render: pageTemplate } = await vite.ssrLoadModule(
    `/src/pages/${pageDirectory}/${pageDirectory}.server.ts`,
  );
  ctx.type = "html";
  // ctx.body = new RenderResultReadable(
  //   ssrRender(renderShellTemplate(pageDirectory, pageTemplate(ctx))),
  // );
  ctx.body = renderShellTemplate(pageDirectory, pageTemplate(ctx))
}
