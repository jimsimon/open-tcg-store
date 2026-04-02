import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  const productId = ctx.params.productId ?? '';
  const condition = decodeURIComponent(ctx.params.condition ?? '');
  const inventoryType = ctx.path.includes('/inventory/sealed/') ? 'sealed' : 'singles';
  return `<ogs-inventory-detail-page ${renderPageAttributes(ctx, { showStoreSelector: true, productId, condition, inventoryType })}></ogs-inventory-detail-page>`;
}
