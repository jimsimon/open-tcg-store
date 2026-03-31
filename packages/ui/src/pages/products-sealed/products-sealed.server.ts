import type { RouterContext } from '@koa/router';
import { escapeHtml } from '../../lib/html-escape';

export function render(ctx: RouterContext) {
  const userRole = ctx.state.auth?.user?.role ?? '';
  const isAnonymous = ctx.state.auth?.user?.isAnonymous === true;
  const userName = ctx.state.auth?.user?.name ?? '';
  return `
    <ogs-products-sealed-page userRole="${escapeHtml(userRole)}" ${isAnonymous ? 'isAnonymous' : ''} userName="${escapeHtml(userName)}"></ogs-products-sealed-page>
  `;
}
