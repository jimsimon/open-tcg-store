import type { RouterContext } from '@koa/router';
import { renderPageAttributes } from '../../lib/server-helpers';

export async function render(ctx: RouterContext) {
  const lotId = ctx.params.lotId ?? '';
  return `<ogs-lot-page ${await renderPageAttributes(ctx, { showStoreSelector: true, lotId })}></ogs-lot-page>`;
}
