import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-settings-data-updates-page ${await renderPageAttributes(ctx, { activePage: 'settings/data-updates' })}></ogs-settings-data-updates-page>`;
}
