import { html } from "lit";
import "./first-time-setup.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  return html`
    <ogs-page path="${ctx.URL.pathname}" hideNav>
      <ogs-first-time-setup-page></ogs-first-time-setup-page>
    </ogs-page>
  `;
}
