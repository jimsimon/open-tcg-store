import type { RouterContext } from '@koa/router';
import { escapeHtml } from '../../lib/html-escape';

export function render(ctx: RouterContext) {
  const userRole = ctx.state.auth?.user?.role ?? '';
  const isAnonymous = ctx.state.auth?.user?.isAnonymous === true;
  const userName = ctx.state.auth?.user?.name ?? '';
  const productId = ctx.params.productId ?? '';
  const condition = ctx.params.condition ?? '';
  const inventoryType = ctx.path.includes('/inventory/sealed/') ? 'sealed' : 'singles';
  return `<ogs-inventory-detail-page userRole="${escapeHtml(userRole)}" ${isAnonymous ? 'isAnonymous' : ''} userName="${escapeHtml(userName)}" productId="${escapeHtml(productId)}" condition="${escapeHtml(decodeURIComponent(condition))}" inventoryType="${escapeHtml(inventoryType)}"></ogs-inventory-detail-page>`;
}
