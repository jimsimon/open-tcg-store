import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-settings-autoprice-page ${await renderPageAttributes(ctx, { activePage: 'settings/autoprice' })}></ogs-settings-autoprice-page>`;
}
