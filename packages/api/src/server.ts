import { bodyParser } from "@koa/bodyparser";
import Router from "@koa/router";
import type { RouterContext } from "@koa/router";
import { toNodeHandler } from "better-auth/node";
import Koa from "koa";
import mount from "koa-mount";
import koaCors from "@koa/cors";
import { createHandler } from "graphql-http/lib/use/koa";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { resolvers } from "./schema/resolvers.generated.ts";
import type { Resolvers } from "./schema/types.generated.ts";
import { typeDefs } from "./schema/typeDefs.generated.ts";
import { ruruHTML } from "ruru/server";
import { auth } from "./auth.ts";

const app = new Koa();
app.use(koaCors());
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: resolvers as Resolvers,
});

app.use(mount("/graphql", createHandler({ schema })));
app.use(async (ctx, next) => {
  if (ctx.URL.pathname.startsWith("/api/auth")) {
    await toNodeHandler(auth)(ctx.req, ctx.res);
  } else {
    return next();
  }
});
app.use(bodyParser());

const router = new Router().get("/graphiql", (ctx: RouterContext) => {
  ctx.status = 200;
  ctx.type = "html";
  ctx.body = ruruHTML({
    endpoint: "/graphql",
  });
});

const port = 5174;
app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(port, () => {
    console.log("Routes:");
    console.log(router.stack.map((i) => i.path));
    console.log(`Server is listening on port ${port}`);
  });
