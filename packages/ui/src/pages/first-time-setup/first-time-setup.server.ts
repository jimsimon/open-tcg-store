import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-first-time-setup-page ${await renderPageAttributes(ctx, { hideNav: true })}></ogs-first-time-setup-page>`;
}
