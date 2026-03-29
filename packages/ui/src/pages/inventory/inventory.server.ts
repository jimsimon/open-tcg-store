import "./inventory.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  return `<ogs-inventory-page userRole="${ctx.state.auth?.user?.role ?? ""}"></ogs-inventory-page>`;
}
