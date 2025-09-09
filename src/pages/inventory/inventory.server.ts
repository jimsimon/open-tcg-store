import { html } from "lit";
import "./inventory.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  return `
    <ogs-inventory-page game="${ctx.params.game}"></ogs-inventory-page>
  `;
}
