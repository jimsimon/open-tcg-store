import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-settings-backup-page ${await renderPageAttributes(ctx, { activePage: 'settings/backup' })}></ogs-settings-backup-page>`;
}
