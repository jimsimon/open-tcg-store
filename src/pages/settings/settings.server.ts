import { html } from "lit";
import "./settings.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  return html`
    <ogs-page path="${ctx.URL.pathname}">
      <h1>Settings</h1>
    </ogs-page>
  `;
}
