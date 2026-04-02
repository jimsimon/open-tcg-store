import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  return `<ogs-settings-locations-page ${renderPageAttributes(ctx, { activePage: 'settings/locations' })}></ogs-settings-locations-page>`;
}
