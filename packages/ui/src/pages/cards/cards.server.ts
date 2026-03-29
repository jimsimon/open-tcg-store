import { html } from "lit";
import "./cards.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  const userRole = ctx.state.auth?.user?.role ?? "";
  return `
    <ogs-cards-page game="${ctx.params.game}" userRole="${userRole}"></ogs-cards-page>
  `;
}
