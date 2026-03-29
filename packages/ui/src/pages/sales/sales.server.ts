import { html } from "lit";
import "./sales.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  const userRole = ctx.state.auth?.user?.role ?? "";
  return `
    <ogs-page path="${ctx.URL.pathname}" userRole="${userRole}">
      <h1>Sales</h1>
    </ogs-page>
  `;
}
