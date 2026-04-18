import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-settings-scheduled-tasks-page ${await renderPageAttributes(ctx, { activePage: 'settings/scheduled-tasks' })}></ogs-settings-scheduled-tasks-page>`;
}
