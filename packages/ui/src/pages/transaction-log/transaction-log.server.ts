import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  return `<ogs-transaction-log-page ${renderPageAttributes(ctx, { showStoreSelector: true })}></ogs-transaction-log-page>`;
}
