import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  return `<ogs-settings-integrations-page ${renderPageAttributes(ctx, { activePage: 'settings/integrations' })}></ogs-settings-integrations-page>`;
}
