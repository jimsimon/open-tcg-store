import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-settings-general-page ${await renderPageAttributes(ctx, { activePage: 'settings/general' })}></ogs-settings-general-page>`;
}
