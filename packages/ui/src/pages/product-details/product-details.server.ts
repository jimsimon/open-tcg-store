import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  return `<ogs-product-details-page ${renderPageAttributes(ctx, { showStoreSelector: true, showCartButton: true, productId: ctx.params.productId })}></ogs-product-details-page>`;
}
