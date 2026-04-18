import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  return `<ogs-pos-page ${await renderPageAttributes(ctx)}></ogs-pos-page>`;
}
