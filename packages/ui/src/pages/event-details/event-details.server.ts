import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-event-details-page ${await renderPageAttributes(ctx, { showStoreSelector: true, activePage: 'events', eventId: ctx.params.eventId })}></ogs-event-details-page>`;
}
