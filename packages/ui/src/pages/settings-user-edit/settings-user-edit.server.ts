import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  const userId = ctx.params.userId ?? '';
  return `<ogs-settings-user-edit-page ${await renderPageAttributes(ctx, { userId })}></ogs-settings-user-edit-page>`;
}
