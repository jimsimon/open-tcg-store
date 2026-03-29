import { html } from "lit";
import "./card-details.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  const userRole = ctx.state.auth?.user?.role ?? "";
  return `
    <ogs-card-details-page game="${ctx.params.game}" cardId="${ctx.params.cardId}" userRole="${userRole}"></ogs-card-details-page>
  `;
}
