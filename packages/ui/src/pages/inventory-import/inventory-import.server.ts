import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-inventory-import-page ${await renderPageAttributes(ctx, { showStoreSelector: true })}></ogs-inventory-import-page>`;
}
