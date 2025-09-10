import { html } from "lit";
import "./cards.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  return `
    <ogs-cards-page game="${ctx.params.game}"></ogs-inventory-page>
  `;
}
