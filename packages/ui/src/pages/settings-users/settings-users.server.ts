import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-settings-users-page ${await renderPageAttributes(ctx, { activePage: 'settings/users' })}></ogs-settings-users-page>`;
}
