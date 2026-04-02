import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  return `<ogs-inventory-import-page ${renderPageAttributes(ctx, { showStoreSelector: true })}></ogs-inventory-import-page>`;
}
