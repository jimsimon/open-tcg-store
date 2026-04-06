import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-buy-rates-page ${await renderPageAttributes(ctx, { activePage: 'buy-rates', showStoreSelector: true })}></ogs-buy-rates-page>`;
}
