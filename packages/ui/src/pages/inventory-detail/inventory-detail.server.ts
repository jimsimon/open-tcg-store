import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  const inventoryItemId = ctx.params.inventoryItemId ?? '';
  const inventoryType = ctx.path.includes('/inventory/sealed/') ? 'sealed' : 'singles';
  return `<ogs-inventory-detail-page ${await renderPageAttributes(ctx, { showStoreSelector: true, inventoryItemId, inventoryType })}></ogs-inventory-detail-page>`;
}
