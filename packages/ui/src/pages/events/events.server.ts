import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-events-page ${await renderPageAttributes(ctx, { showStoreSelector: true, activePage: 'events' })}></ogs-events-page>`;
}
