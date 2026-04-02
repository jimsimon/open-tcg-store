import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  return `<ogs-inventory-singles-page ${renderPageAttributes(ctx, { showStoreSelector: true })}></ogs-inventory-singles-page>`;
}
