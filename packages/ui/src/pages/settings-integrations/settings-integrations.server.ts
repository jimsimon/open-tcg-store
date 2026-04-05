import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-settings-integrations-page ${await renderPageAttributes(ctx, { activePage: 'settings/integrations' })}></ogs-settings-integrations-page>`;
}
