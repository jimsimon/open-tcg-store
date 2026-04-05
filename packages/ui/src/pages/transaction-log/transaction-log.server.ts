import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-transaction-log-page ${await renderPageAttributes(ctx, { showStoreSelector: true })}></ogs-transaction-log-page>`;
}
