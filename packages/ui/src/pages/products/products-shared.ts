import { css, unsafeCSS } from 'lit';
import { BP_MOBILE } from '../../lib/breakpoints';

// ============================================================
// SHARED STYLES FOR PRODUCT PAGES
// Uses WebAwesome CSS variables for proper light/dark mode support
//
// Key WebAwesome variables:
//   Surface:  --wa-color-surface-default, --wa-color-surface-raised
//   Text:     --wa-color-text-normal, --wa-color-text-quiet
//   Border:   --wa-color-border-normal, --wa-color-border-quiet, --wa-color-border-loud
//   Fill:     --wa-color-fill-normal, --wa-color-fill-quiet, --wa-color-fill-loud
//   On:       --wa-color-on-normal, --wa-color-on-quiet, --wa-color-on-loud
//   Brand:    --wa-color-brand, --wa-color-brand-60, --wa-color-brand-fill-normal
//   Neutral:  --wa-color-neutral-10 through --wa-color-neutral-95
//   Status:   --wa-color-success-*, --wa-color-warning-*, --wa-color-danger-*
// ============================================================

// --- Product Page Container ---

export const productPageStyles = css`
  :host {
    box-sizing: border-box;
    display: block;
  }

  * {
    box-sizing: border-box;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .page-header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--wa-border-radius-l);
    background: var(--wa-color-brand-fill-normal);
    color: var(--wa-color-brand-on-normal);
    flex-shrink: 0;
  }

  .page-header-content {
    flex: 1;
  }

  .page-header h2 {
    margin: 0;
    font-size: var(--wa-font-size-2xl);
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .page-header p {
    margin: 0.25rem 0 0 0;
    color: var(--wa-color-text-muted);
    font-size: var(--wa-font-size-m);
  }
`;

// --- Stats Bar ---

export const statsBarStyles = css`
  .stats-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.75rem 1rem;
    background: var(--wa-color-surface-raised);
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 10px;
    min-width: 140px;
    flex: 1;
    max-width: 280px;
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--wa-color-fill-quiet);
    color: var(--wa-color-brand-60);
    flex-shrink: 0;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--wa-color-text-normal);
    line-height: 1.2;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--wa-color-text-quiet);
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
`;

// --- Filter Bar ---

export const filterBarStyles = css`
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    align-items: flex-end;
    padding: 1rem;
    background: var(--wa-color-surface-raised);
    border: 1px solid var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-l);
  }

  .filter-bar wa-input {
    flex: 1;
    min-width: 200px;
  }

  .filter-bar wa-select {
    min-width: 150px;
  }

  @media (max-width: ${unsafeCSS(BP_MOBILE)}) {
    .filter-bar wa-input {
      min-width: 0;
      flex-basis: 100%;
    }

    .filter-bar wa-select {
      min-width: 0;
      flex-basis: 100%;
    }
  }

  .in-stock-toggle {
    display: inline-flex;
    align-items: center;
    align-self: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: var(--wa-color-fill-quiet);
    border: 1px solid var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-m);
    cursor: pointer;
    user-select: none;
    transition: all 0.15s ease;
    color: var(--wa-color-text-normal);
    font-size: var(--wa-font-size-m);
    font-weight: 500;
  }

  .in-stock-toggle:hover {
    border-color: var(--wa-color-brand-60);
    background: var(--wa-color-brand-fill-quiet);
  }

  .in-stock-toggle.active {
    background: var(--wa-color-brand-fill-loud);
    border-color: var(--wa-color-brand);
    color: var(--wa-color-brand-on-loud);
  }

  .in-stock-toggle wa-checkbox::part(checkbox) {
    border-radius: 4px;
  }
`;

// --- Product Grid ---

export const productGridStyles = css`
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  /* --- wa-card overrides --- */

  .products-grid wa-card {
    --spacing: 0;
    transition: all 0.2s ease;
  }

  .products-grid wa-card:hover {
    border-color: var(--wa-color-brand-60);
    box-shadow: 0 4px 12px var(--wa-color-shadow);
    transform: translateY(-2px);
  }

  .products-grid wa-card::part(body) {
    padding: 0;
    flex: 1;
  }

  .products-grid wa-card::part(footer) {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  /* --- Card link (wraps image + content, no interactive children) --- */

  .product-card-link {
    display: flex;
    flex-direction: column;
    color: inherit;
    text-decoration: none;
    background: var(--wa-color-fill-quiet);
    border-radius: var(--wa-border-radius-l) var(--wa-border-radius-l) 0 0;
  }

  /* --- Card image area --- */

  .product-card-image {
    width: 100%;
    height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    overflow: hidden;
  }

  .product-card-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .product-card-image .card-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--wa-color-text-quiet);
    font-size: 3rem;
  }

  .product-card-image .card-placeholder[hidden] {
    display: none;
  }

  /* --- Card content area (inside the link) --- */

  .product-card-content {
    padding: 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .product-card-name {
    font-size: var(--wa-font-size-m);
    font-weight: 600;
    color: var(--wa-color-text-normal);
    margin: 0;
    line-height: 1.3;
    min-height: 2.6em; /* reserve 2 lines (2 × 1.3 line-height) */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .product-card-meta {
    font-size: var(--wa-font-size-m);
    color: var(--wa-color-text-quiet);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }

  .product-card-set-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .meta-separator {
    width: 1px;
    height: 0.875rem;
    background: var(--wa-color-border-quiet);
  }

  /* --- Card footer (outside the link, in wa-card footer slot) --- */

  .product-card-footer {
    display: flex;
    flex-direction: column;
  }

  .product-card-footer--oos .product-card-price-row {
    /* Visually center the price row within the full footer height.
       transform is layout-inert so card heights stay matched. */
    transform: translateY(calc((0.5rem + var(--cart-row-height, 54px)) / 2));
  }

  .product-card-footer--oos .product-card-cart {
    visibility: hidden;
  }

  /* Row: condition dropdown + price side by side */
  .product-card-price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .product-price {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--wa-color-text-normal);
    white-space: nowrap;
    margin-left: auto;
  }

  .product-price-from {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--wa-color-text-quiet);
  }

  /* Row: availability text + qty input + cart button */
  .product-card-cart {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.625rem;
    border-top: 1px solid var(--wa-color-border-quiet);
    margin-top: 0.5rem;
  }

  .product-card-availability {
    font-size: 0.8125rem;
    color: var(--wa-color-text-quiet);
    white-space: nowrap;
  }

  .product-card-availability.out-of-stock {
    color: var(--wa-color-danger-60);
  }

  .product-card-cart wa-input {
    width: 56px;
    margin-left: auto;
  }

  .product-card-cart wa-input::part(form-control) {
    display: flex;
    align-items: center;
  }

  .product-card-cart wa-input::part(form-control-label) {
    display: none;
  }

  .product-card-cart wa-input::part(base) {
    border-radius: 6px;
  }

  /* --- Condition select within cards --- */

  .product-card-condition {
    width: 155px;
    flex-shrink: 0;
  }

  .product-card-condition::part(combobox) {
    font-size: 0.8125rem;
    min-height: 0;
    padding: 0.25rem 0.5rem;
  }
`;

// --- Shared Badge & Utility Styles (used by both grid and table views) ---

export const productBadgeStyles = css`
  .out-of-stock-text {
    color: var(--wa-color-text-quiet);
    font-style: italic;
    font-size: var(--wa-font-size-m);
  }

  .price-value {
    font-weight: 600;
    color: var(--wa-color-text-normal);
  }
`;

// --- Pagination ---

export const paginationStyles = css`
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
    background: var(--wa-color-surface-raised);
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 12px;
  }

  .pagination-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--wa-color-text-quiet);
    font-size: var(--wa-font-size-m);
  }

  .pagination-buttons {
    display: flex;
    gap: 0.375rem;
    align-items: center;
  }

  .pagination-buttons wa-button {
    border-radius: 8px;
    min-width: 38px;
    justify-content: center;
  }

  .pagination-buttons wa-button[data-current] {
    font-weight: 700;
  }

  .page-size-select {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 1px solid var(--wa-color-border-quiet);
  }

  .page-size-select label {
    font-size: var(--wa-font-size-m);
    color: var(--wa-color-text-quiet);
  }

  .page-size-select wa-select {
    width: 80px;
  }
`;

// --- Empty State ---

export const emptyStateStyles = css`
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4rem 2rem;
    color: var(--wa-color-text-muted);
    background: var(--wa-color-surface-raised);
    border: 2px dashed var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-l);
    margin: 0.5rem 0;
  }

  .empty-state > wa-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    font-size: var(--wa-font-size-xl);
    font-weight: 700;
    color: var(--wa-color-text-normal);
  }

  .empty-state p {
    margin: 0 0 1.5rem 0;
    max-width: 400px;
    margin-inline: auto;
  }
`;

// --- Loading State ---

export const loadingStateStyles = css`
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
  }

  .loading-container wa-spinner {
    --spinner-size: 2.5rem;
  }

  .loading-text {
    color: var(--wa-color-text-quiet);
    font-size: var(--wa-font-size-m);
  }
`;

// --- Helper: Format currency ---
// Re-exported from shared utility; values are now integer cents.
export { formatCurrency } from '../../lib/currency.ts';

// --- Helper: Compute product stats ---

export function computeProductStats(products: { totalQuantity: number; lowestPrice: string | null }[]): {
  totalProducts: number;
  inStockCount: number;
  avgPrice: number;
  lowestPrice: number | null;
} {
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.totalQuantity > 0).length;
  const prices = products
    .map((p) => (p.lowestPrice ? parseFloat(p.lowestPrice) : null))
    .filter((p): p is number => p !== null && !isNaN(p));
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

  return { totalProducts, inStockCount, avgPrice, lowestPrice };
}
