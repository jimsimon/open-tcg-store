import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export function render(ctx: RouterContext) {
  return `<ogs-settings-backup-page ${renderPageAttributes(ctx, { activePage: 'settings/backup' })}></ogs-settings-backup-page>`;
}
