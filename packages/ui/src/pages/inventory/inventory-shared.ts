import { css, html, nothing, unsafeCSS } from 'lit';
import {
  type InventoryItem,
  type ProductSearchResult,
  type ProductPrice,
  TypedDocumentString,
} from '../../graphql/graphql.ts';

// --- GraphQL Operations ---

export const GetInventoryQuery = new TypedDocumentString(`
  query GetInventory($filters: InventoryFilters, $pagination: PaginationInput) {
    getInventory(filters: $filters, pagination: $pagination) {
      items {
        id
        productId
        productName
        gameName
        setName
        rarity
        isSingle
        isSealed
        condition
        quantity
        price
        costBasis
        acquisitionDate
        notes
        createdAt
        updatedAt
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`) as unknown as TypedDocumentString<
  {
    getInventory: {
      items: InventoryItem[];
      totalCount: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  },
  {
    filters?: {
      gameName?: string | null;
      setName?: string | null;
      rarity?: string | null;
      condition?: string | null;
      searchTerm?: string | null;
      includeSingles?: boolean | null;
      includeSealed?: boolean | null;
    } | null;
    pagination?: { page?: number | null; pageSize?: number | null } | null;
  }
>;

export const SearchProductsQuery = new TypedDocumentString(`
  query SearchProducts($searchTerm: String!, $game: String) {
    searchProducts(searchTerm: $searchTerm, game: $game) {
      id
      name
      gameName
      setName
      rarity
      imageUrl
      isSingle
      isSealed
      prices {
        subTypeName
        lowPrice
        midPrice
        highPrice
        marketPrice
        directLowPrice
      }
    }
  }
`) as unknown as TypedDocumentString<
  { searchProducts: ProductSearchResult[] },
  { searchTerm: string; game?: string | null }
>;

export const AddInventoryItemMutation = new TypedDocumentString(`
  mutation AddInventoryItem($input: AddInventoryItemInput!) {
    addInventoryItem(input: $input) {
      id
      productId
      productName
      gameName
      setName
      rarity
      condition
      quantity
      price
      costBasis
      acquisitionDate
      notes
    }
  }
`) as unknown as TypedDocumentString<
  { addInventoryItem: InventoryItem },
  {
    input: {
      productId: number;
      condition: string;
      quantity: number;
      price: number;
      costBasis?: number | null;
      acquisitionDate?: string | null;
      notes?: string | null;
    };
  }
>;

export const UpdateInventoryItemMutation = new TypedDocumentString(`
  mutation UpdateInventoryItem($input: UpdateInventoryItemInput!) {
    updateInventoryItem(input: $input) {
      id
      productId
      productName
      gameName
      setName
      rarity
      condition
      quantity
      price
      costBasis
      acquisitionDate
      notes
    }
  }
`) as unknown as TypedDocumentString<
  { updateInventoryItem: InventoryItem },
  {
    input: {
      id: number;
      condition?: string | null;
      quantity?: number | null;
      price?: number | null;
      costBasis?: number | null;
      acquisitionDate?: string | null;
      notes?: string | null;
    };
  }
>;

export const DeleteInventoryItemMutation = new TypedDocumentString(`
  mutation DeleteInventoryItem($id: Int!) {
    deleteInventoryItem(id: $id)
  }
`) as unknown as TypedDocumentString<{ deleteInventoryItem: boolean }, { id: number }>;

export const BulkUpdateInventoryMutation = new TypedDocumentString(`
  mutation BulkUpdateInventory($input: BulkUpdateInventoryInput!) {
    bulkUpdateInventory(input: $input) {
      id
    }
  }
`) as unknown as TypedDocumentString<
  { bulkUpdateInventory: { id: number }[] },
  {
    input: {
      ids: number[];
      condition?: string | null;
      quantity?: number | null;
      price?: number | null;
      costBasis?: number | null;
      acquisitionDate?: string | null;
      notes?: string | null;
    };
  }
>;

export const BulkDeleteInventoryMutation = new TypedDocumentString(`
  mutation BulkDeleteInventory($input: BulkDeleteInventoryInput!) {
    bulkDeleteInventory(input: $input)
  }
`) as unknown as TypedDocumentString<{ bulkDeleteInventory: boolean }, { input: { ids: number[] } }>;

// --- Interfaces ---

export interface AddForm {
  quantity: number;
  condition: string;
  price: number;
  costBasis: number;
  acquisitionDate: string;
  notes: string;
}

export interface BulkEditForm {
  condition: string;
  quantity: number | null;
  price: number | null;
  costBasis: number | null;
  acquisitionDate: string;
  notes: string;
}

// --- Debounce utility ---

// biome-ignore lint/suspicious/noExplicitAny: debounce needs flexible typing
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  // biome-ignore lint/suspicious/noExplicitAny: debounce needs flexible typing
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as unknown as T;
}

// --- Shared CSS Styles ---

import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';

export const sharedInventoryStyles = [
  css`
    ${unsafeCSS(nativeStyle)}
  `,
  css`
    ${unsafeCSS(utilityStyles)}
  `,
  css`
    :host {
      box-sizing: border-box;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    /* --- Page Header --- */

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

    /* --- Summary Stats --- */

    .stats-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      background: var(--wa-color-surface-raised);
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-l);
      min-width: 160px;
      flex: 1;
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--wa-border-radius-m);
      background: var(--wa-color-brand-container);
      color: var(--wa-color-brand-text);
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .stat-icon.success {
      background: var(--wa-color-success-container);
      color: var(--wa-color-success-text);
    }

    .stat-icon.warning {
      background: var(--wa-color-warning-container);
      color: var(--wa-color-warning-text);
    }

    .stat-icon.neutral {
      background: var(--wa-color-neutral-container);
      color: var(--wa-color-text-muted);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .stat-label {
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 600;
    }

    .stat-value {
      font-size: var(--wa-font-size-xl);
      font-weight: 700;
      line-height: 1;
    }

    /* --- Filter Bar --- */

    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
      align-items: flex-end;
      padding: 1rem;
      background: var(--wa-color-surface-raised);
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-l);
    }

    .filter-bar wa-input {
      flex: 1 1 0%;
      min-width: 200px;
    }

    .filter-bar wa-select {
      flex: 0 0 auto;
      min-width: 150px;
      width: auto;
    }

    /* --- Action Bar --- */

    .action-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .action-bar wa-button {
      flex: 0 0 auto;
    }

    .action-bar-spacer {
      flex: 1 1 0%;
      min-width: 0;
    }

    .selection-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      background: var(--wa-color-brand-container);
      color: var(--wa-color-brand-text);
      border-radius: var(--wa-border-radius-pill);
      font-size: var(--wa-font-size-s);
      font-weight: 600;
    }

    /* --- Table --- */

    .table-container {
      overflow-x: auto;
    }

    .wa-table th,
    .wa-table td {
      vertical-align: middle;
    }

    .wa-table th {
      font-size: var(--wa-font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--wa-color-text-muted);
      font-weight: 600;
    }

    .price-cell {
      text-align: right;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .quantity-cell {
      text-align: center;
    }

    .actions-cell {
      white-space: nowrap;
    }

    .actions-cell wa-button {
      transition: opacity 0.15s;
    }

    .product-name {
      font-weight: 500;
    }

    .game-name,
    .set-name {
      color: var(--wa-color-text-muted);
      font-size: var(--wa-font-size-s);
    }

    /* --- Condition Badge --- */

    .condition-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      border-radius: var(--wa-border-radius-pill);
      font-size: var(--wa-font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .condition-badge.nm {
      background: var(--wa-color-success-container);
      color: var(--wa-color-success-text);
    }

    .condition-badge.lp {
      background: var(--wa-color-brand-container);
      color: var(--wa-color-brand-text);
    }

    .condition-badge.mp {
      background: var(--wa-color-warning-container);
      color: var(--wa-color-warning-text);
    }

    .condition-badge.hp {
      background: var(--wa-color-danger-container);
      color: var(--wa-color-danger-text);
    }

    .condition-badge.d {
      background: var(--wa-color-neutral-container);
      color: var(--wa-color-text-muted);
    }

    /* --- Pagination --- */

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .pagination-info {
      color: var(--wa-color-text-muted);
      font-size: var(--wa-font-size-s);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .pagination-buttons {
      display: flex;
      gap: 0.25rem;
      align-items: center;
    }

    .pagination-buttons wa-button[data-current] {
      font-weight: bold;
      text-decoration: underline;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-text-muted);
    }

    .page-size-selector wa-select {
      width: 80px;
    }

    /* --- Loading & Empty States --- */

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
    }

    .loading-container span {
      color: var(--wa-color-text-muted);
      font-size: var(--wa-font-size-s);
    }

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
      color: var(--wa-color-text-normal);
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      max-width: 400px;
      margin-inline: auto;
    }

    /* --- Add Dialog Styles --- */

    .search-results {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-m);
      margin-top: 0.5rem;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .search-result-item:hover {
      background-color: var(--wa-color-surface-alt);
    }

    .search-result-item img {
      width: 40px;
      height: 56px;
      object-fit: contain;
      border-radius: var(--wa-border-radius-s);
    }

    .search-result-item .result-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .search-result-item .result-info strong {
      font-size: var(--wa-font-size-s);
    }

    .search-result-item .result-info small {
      color: var(--wa-color-text-muted);
      font-size: var(--wa-font-size-xs);
    }

    .selected-product {
      display: flex;
      gap: 1rem;
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-l);
      padding: 1rem;
      margin-top: 0.75rem;
      margin-bottom: 0.75rem;
      background: var(--wa-color-surface-alt);
    }

    .selected-product-info {
      flex: 1;
    }

    .selected-product h3 {
      margin: 0 0 0.25rem 0;
      font-size: var(--wa-font-size-l);
    }

    .selected-product p {
      margin: 0 0 0.5rem 0;
      color: var(--wa-color-text-muted);
      font-size: var(--wa-font-size-s);
    }

    .product-image {
      max-width: 120px;
      border-radius: var(--wa-border-radius-m);
      flex-shrink: 0;
    }

    .market-prices {
      margin-top: 0.75rem;
    }

    .market-prices h4 {
      margin: 0 0 0.5rem 0;
      font-size: var(--wa-font-size-s);
      font-weight: 600;
    }

    .price-row {
      display: grid;
      grid-template-columns: 1fr repeat(3, auto);
      gap: 0.75rem;
      font-size: var(--wa-font-size-xs);
      padding: 0.25rem 0;
      border-bottom: 1px solid var(--wa-color-surface-border);
    }

    .price-row:last-child {
      border-bottom: none;
    }

    .profit-summary {
      display: flex;
      gap: 1.5rem;
      padding: 0.875rem 1rem;
      margin-top: 0.75rem;
      background: var(--wa-color-surface-alt);
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-l);
      font-size: var(--wa-font-size-s);
      font-weight: 500;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .delete-confirm-name {
      font-weight: bold;
      color: var(--wa-color-text-normal);
    }

    wa-dialog::part(body) {
      max-height: 70vh;
      overflow-y: auto;
    }

    wa-dialog::part(title) {
      font-size: var(--wa-font-size-xl);
      font-weight: 700;
    }

    /* --- Edit dialog header --- */

    .edit-item-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--wa-color-surface-alt);
      border-radius: var(--wa-border-radius-l);
      margin-bottom: 0.75rem;
    }

    .edit-item-header wa-icon {
      font-size: 1.5rem;
      color: var(--wa-color-brand-text);
    }

    .edit-item-header-info h3 {
      margin: 0;
      font-size: var(--wa-font-size-m);
      font-weight: 600;
    }

    .edit-item-header-info p {
      margin: 0;
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-text-muted);
    }

    /* --- Delete dialog --- */

    .delete-warning {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      padding: 1rem;
      background: var(--wa-color-danger-container);
      border-radius: var(--wa-border-radius-l);
    }

    .delete-warning wa-icon {
      font-size: 1.5rem;
      color: var(--wa-color-danger-text);
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .delete-warning-text p {
      margin: 0;
    }

    .delete-warning-text p:first-child {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .delete-warning-text p:last-child {
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-text-muted);
    }
  `,
];

// --- Shared render helpers ---

export function renderConditionBadge(condition: string | null | undefined) {
  if (!condition) return html`<span>—</span>`;
  const lower = condition.toLowerCase();
  const labels: Record<string, string> = {
    nm: 'Near Mint',
    lp: 'Lightly Played',
    mp: 'Mod. Played',
    hp: 'Heavily Played',
    d: 'Damaged',
  };
  return html`<span class="condition-badge ${lower}">${labels[lower] ?? condition}</span>`;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  return `$${value.toFixed(2)}`;
}

export function renderProfitSummary(price: number, costBasis: number, quantity: number) {
  if (!costBasis || costBasis <= 0) return nothing;

  const profitPerUnit = price - costBasis;
  const margin = price > 0 ? (profitPerUnit / price) * 100 : 0;
  const totalPL = profitPerUnit * quantity;

  return html`
    <div class="profit-summary">
      <div style="color: ${profitPerUnit >= 0 ? 'var(--wa-color-success-text)' : 'var(--wa-color-danger-text)'}">
        <wa-icon
          name="${profitPerUnit >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'}"
          style="font-size: 0.875em;"
        ></wa-icon>
        P/L per unit: ${formatCurrency(profitPerUnit)}
      </div>
      <div>Margin: ${margin.toFixed(1)}%</div>
      <div style="color: ${totalPL >= 0 ? 'var(--wa-color-success-text)' : 'var(--wa-color-danger-text)'}">
        Total P/L: ${formatCurrency(totalPL)}
      </div>
    </div>
  `;
}

export function renderMarketPrices(prices: ProductPrice[]) {
  if (!prices?.length) return nothing;

  return html`
    <div class="market-prices">
      <h4>Market Prices</h4>
      ${prices.map(
        (p: ProductPrice) => html`
          <div class="price-row">
            <span>${p.subTypeName}</span>
            <span>Low: ${p.lowPrice != null ? `$${p.lowPrice.toFixed(2)}` : '—'}</span>
            <span>Mid: ${p.midPrice != null ? `$${p.midPrice.toFixed(2)}` : '—'}</span>
            <span>Market: ${p.marketPrice != null ? `$${p.marketPrice.toFixed(2)}` : '—'}</span>
          </div>
        `,
      )}
    </div>
  `;
}

export function computeInventoryStats(items: InventoryItem[]) {
  let totalItems = 0;
  let totalQuantity = 0;
  let totalValue = 0;
  let totalCost = 0;

  for (const item of items) {
    totalItems++;
    totalQuantity += item.quantity;
    totalValue += item.price * item.quantity;
    if (item.costBasis != null) {
      totalCost += item.costBasis * item.quantity;
    }
  }

  return { totalItems, totalQuantity, totalValue, totalCost };
}

// Re-export types for convenience
export type { InventoryItem, ProductSearchResult, ProductPrice };
