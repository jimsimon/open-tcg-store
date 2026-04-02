import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  return `<ogs-settings-general-page ${renderPageAttributes(ctx, { activePage: 'settings/general' })}></ogs-settings-general-page>`;
}
