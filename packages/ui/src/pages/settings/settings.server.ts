import { html } from "lit";
import "./settings.client.ts";
import type { RouterContext } from "@koa/router";
import { escapeHtml } from "../../lib/html-escape";

export function render(ctx: RouterContext) {
  const userRole = ctx.state.auth?.user?.role ?? "";
  const isAnonymous = ctx.state.auth?.user?.isAnonymous === true;
  const userName = ctx.state.auth?.user?.name ?? "";
  return `
    <ogs-page path="${escapeHtml(ctx.URL.pathname)}" userRole="${escapeHtml(userRole)}" ${isAnonymous ? "isAnonymous" : ""} userName="${escapeHtml(userName)}">
      <h1>Settings</h1>
    </ogs-page>
  `;
}
