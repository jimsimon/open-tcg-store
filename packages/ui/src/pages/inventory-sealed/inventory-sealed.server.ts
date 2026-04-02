import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  return `<ogs-inventory-sealed-page ${renderPageAttributes(ctx, { showStoreSelector: true })}></ogs-inventory-sealed-page>`;
}
