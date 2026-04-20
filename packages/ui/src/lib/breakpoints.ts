/**
 * Shared breakpoint constants for responsive design.
 *
 * CSS custom properties cannot be used inside `@media` queries, so these are
 * exported as plain string constants for use in Lit `css` tagged templates.
 *
 * Usage in a Lit component:
 * ```ts
 * import { BP_MOBILE } from '../../lib/breakpoints';
 * static styles = css`
 *   @media (max-width: ${unsafeCSS(BP_MOBILE)}) { ... }
 * `;
 * ```
 */

/**
 * max-width for mobile layouts — matches `wa-page mobile-breakpoint="768"`
 * in ogs-page.ts so the page shell and component-level media queries
 * transition at the same viewport width.
 */
export const BP_MOBILE = '768px';

/** max-width for tablet layouts (below this value = tablet or smaller) */
export const BP_TABLET = '960px';

/** min-width for desktop layouts */
export const BP_DESKTOP = '1200px';

/** min-width for wide/4K layouts */
export const BP_WIDE = '1600px';
