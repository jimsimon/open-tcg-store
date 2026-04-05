import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-products-sealed-page ${await renderPageAttributes(ctx, { showStoreSelector: true, showCartButton: true })}></ogs-products-sealed-page>`;
}
