import { css } from "lit";

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
    font-size: var(--wa-font-size-s);
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
    max-width: 200px;
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
    font-size: var(--wa-font-size-s);
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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .product-card {
    background: var(--wa-color-surface-raised);
    border: 1px solid var(--wa-color-border-quiet);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
  }

  .product-card:hover {
    border-color: var(--wa-color-brand-60);
    box-shadow: 0 4px 12px var(--wa-color-shadow);
    transform: translateY(-2px);
  }

  .product-card-image {
    width: 100%;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--wa-color-fill-quiet);
    overflow: hidden;
  }

  .product-card-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .product-card-content {
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .product-card-name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--wa-color-text-normal);
    margin: 0 0 0.375rem 0;
    line-height: 1.3;
  }

  .product-card-meta {
    font-size: 0.8125rem;
    color: var(--wa-color-text-quiet);
    margin: 0 0 0.75rem 0;
  }

  .product-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 0.75rem;
    border-top: 1px solid var(--wa-color-border-quiet);
  }

  .product-price {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--wa-color-text-normal);
  }

  .product-price-from {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--wa-color-text-quiet);
  }

  .product-quantity {
    font-size: 0.8125rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    background: var(--wa-color-fill-quiet);
    color: var(--wa-color-text-quiet);
  }

  .product-quantity.in-stock {
    background: var(--wa-color-success-fill-quiet);
    color: var(--wa-color-success-on-quiet);
  }

  .product-quantity.out-of-stock {
    background: var(--wa-color-danger-fill-quiet);
    color: var(--wa-color-danger-on-quiet);
  }
`;

// --- Product Table (alternative to grid) ---

export const productTableStyles = css`
  .table-container {
    overflow-x: auto;
    border-radius: 12px;
    border: 1px solid var(--wa-color-border-quiet);
    background: var(--wa-color-surface-raised);
  }

  .wa-table {
    width: 100%;
    border-collapse: collapse;
  }

  .wa-table th {
    background: var(--wa-color-fill-quiet);
    font-weight: 600;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: var(--wa-color-text-quiet);
    padding: 0.875rem 1rem;
    text-align: left;
    border-bottom: 2px solid var(--wa-color-border-quiet);
  }

  .wa-table td {
    padding: 0.875rem 1rem;
    vertical-align: middle;
    border-bottom: 1px solid var(--wa-color-border-quiet);
    color: var(--wa-color-text-normal);
  }

  .wa-table tr:last-child td {
    border-bottom: none;
  }

  .wa-table tbody tr {
    transition: background 0.15s ease;
  }

  .wa-table tbody tr:hover td {
    background: var(--wa-color-fill-quiet);
  }

  .card-thumbnail {
    width: 50px;
    height: 65px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    overflow: hidden;
    background: var(--wa-color-fill-quiet);
    color: var(--wa-color-text-quiet);
    font-size: 20px;
  }

  .card-thumbnail img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .product-name {
    font-weight: 600;
    color: var(--wa-color-text-normal);
  }

  .product-name a {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .product-name a:hover {
    color: var(--wa-color-text-link);
    text-decoration: underline;
  }

  .product-set {
    font-size: 0.875rem;
    color: var(--wa-color-text-quiet);
  }

  .price-cell {
    text-align: right;
    white-space: nowrap;
  }

  .price-value {
    font-weight: 600;
    color: var(--wa-color-text-normal);
  }

  .price-from {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--wa-color-text-quiet);
  }

  .quantity-cell {
    text-align: center;
  }

  .quantity-badge {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    min-width: 44px;
    background: var(--wa-color-fill-quiet);
    color: var(--wa-color-text-normal);
  }

  .quantity-badge.in-stock {
    background: var(--wa-color-success-fill-quiet);
    color: var(--wa-color-success-on-quiet);
  }

  .quantity-badge.low-stock {
    background: var(--wa-color-warning-fill-quiet);
    color: var(--wa-color-warning-on-quiet);
  }

  .quantity-badge.out-of-stock {
    background: var(--wa-color-danger-fill-quiet);
    color: var(--wa-color-danger-on-quiet);
  }

  .out-of-stock-text {
    color: var(--wa-color-text-quiet);
    font-style: italic;
  }

  .game-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
    background: var(--wa-color-fill-quiet);
    color: var(--wa-color-on-normal);
  }

  .game-badge.magic {
    background: var(--wa-color-warning-fill-quiet);
    color: var(--wa-color-warning-on-quiet);
  }

  .game-badge.pokemon {
    background: var(--wa-color-danger-fill-quiet);
    color: var(--wa-color-danger-on-quiet);
  }

  .finish-badges {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .finish-badge {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    background: var(--wa-color-fill-quiet);
    color: var(--wa-color-on-normal);
  }

  .finish-badge.holofoil {
    background: var(--wa-color-warning-fill-quiet);
    color: var(--wa-color-warning-on-quiet);
  }

  .finish-badge.non-foil {
    background: var(--wa-color-neutral-fill-quiet);
    color: var(--wa-color-neutral-on-quiet);
  }

  .finish-badge.glossy {
    background: var(--wa-color-brand-fill-quiet);
    color: var(--wa-color-brand-on-quiet);
  }
`;

// --- Cart Controls ---

export const cartControlsStyles = css`
  .cart-controls {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    align-items: center;
    justify-content: flex-end;
  }

  .cart-controls wa-input {
    width: 70px;
  }

  .cart-controls wa-input::part(base) {
    border-radius: 6px;
  }

  .cart-controls wa-button {
    border-radius: 6px;
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
    font-size: 0.875rem;
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
    font-size: 0.8125rem;
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
    padding: 4rem 2rem;
    text-align: center;
    background: var(--wa-color-surface-raised);
    border: 2px dashed var(--wa-color-border-quiet);
    border-radius: 16px;
    margin: 1.5rem 0;
  }

  .empty-state-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--wa-color-fill-quiet);
    color: var(--wa-color-text-quiet);
    margin-bottom: 1.5rem;
    font-size: 2rem;
    box-shadow: 0 2px 8px var(--wa-color-shadow);
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--wa-color-text-normal);
  }

  .empty-state p {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--wa-color-text-quiet);
    max-width: 360px;
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
    font-size: 0.9375rem;
  }
`;

// --- Helper: Get quantity badge class ---

export function getQuantityBadgeClass(quantity: number | null | undefined): string {
  if (!quantity || quantity <= 0) return "out-of-stock";
  if (quantity <= 3) return "low-stock";
  return "in-stock";
}

// --- Helper: Format currency ---

export function formatCurrency(value: string | null | undefined, fromPrefix = true): string {
  if (value == null) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return `${fromPrefix ? "$" : ""}${num.toFixed(2)}`;
}

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
