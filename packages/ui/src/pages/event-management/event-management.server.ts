import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-event-management-page ${await renderPageAttributes(ctx, { activePage: 'event-management' })}></ogs-event-management-page>`;
}
