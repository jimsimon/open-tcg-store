import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-settings-buyrates-page ${await renderPageAttributes(ctx, { activePage: 'settings/buyrates' })}></ogs-settings-buyrates-page>`;
}
