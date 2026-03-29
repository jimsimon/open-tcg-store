import "./inventory-import.client.ts";
import type { RouterContext } from "@koa/router";

export function render(ctx: RouterContext) {
  const userRole = ctx.state.auth?.user?.role ?? "";
  return `<ogs-inventory-import-page userRole="${userRole}"></ogs-inventory-import-page>`;
}
