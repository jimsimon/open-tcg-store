import { html } from "lit";
import "./sales.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  return html`
    <ogs-page path="${ctx.URL.pathname}">
      <h1>Sales</h1>
    </ogs-page>
  `;
}
