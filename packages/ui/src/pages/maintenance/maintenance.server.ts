import type { RouterContext } from '@koa/router';

export async function render(_ctx: RouterContext) {
  return `<ogs-maintenance-page></ogs-maintenance-page>`;
}
