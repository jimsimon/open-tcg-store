import { css, html, nothing, unsafeCSS } from "lit";
import {
  type InventoryItem,
  type ProductSearchResult,
  type ProductPrice,
  TypedDocumentString,
} from "../../graphql/graphql.ts";

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

import nativeStyle from "@awesome.me/webawesome/dist/styles/native.css?inline";
import utilityStyles from "@awesome.me/webawesome/dist/styles/utilities.css?inline";

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

    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
      align-items: flex-end;
    }

    .filter-bar wa-input {
      flex: 1;
      min-width: 200px;
    }

    .filter-bar wa-select {
      min-width: 150px;
    }

    .action-bar {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .table-container {
      overflow-x: auto;
    }

    .wa-table th,
    .wa-table td {
      vertical-align: middle;
    }

    .price-cell {
      text-align: right;
      white-space: nowrap;
    }

    .quantity-cell {
      text-align: center;
    }

    .actions-cell {
      white-space: nowrap;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .pagination-info {
      color: var(--wa-color-text-secondary);
      font-size: var(--wa-font-size-s);
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

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--wa-color-text-secondary);
    }

    /* Add Dialog Styles */
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
      color: var(--wa-color-text-secondary);
      font-size: var(--wa-font-size-xs);
    }

    .selected-product {
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-m);
      padding: 1rem;
      margin-top: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .selected-product h3 {
      margin: 0 0 0.25rem 0;
    }

    .selected-product p {
      margin: 0 0 0.5rem 0;
      color: var(--wa-color-text-secondary);
      font-size: var(--wa-font-size-s);
    }

    .product-image {
      max-width: 200px;
      border-radius: var(--wa-border-radius-m);
      margin-bottom: 0.5rem;
    }

    .market-prices {
      margin-top: 0.75rem;
    }

    .market-prices h4 {
      margin: 0 0 0.5rem 0;
      font-size: var(--wa-font-size-s);
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
      padding: 0.75rem;
      margin-top: 0.75rem;
      background: var(--wa-color-surface-alt);
      border-radius: var(--wa-border-radius-m);
      font-size: var(--wa-font-size-s);
      font-weight: 500;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .delete-confirm-name {
      font-weight: bold;
    }

    wa-dialog::part(body) {
      max-height: 70vh;
      overflow-y: auto;
    }
  `,
];

// --- Shared render helpers ---

export function renderProfitSummary(price: number, costBasis: number, quantity: number) {
  if (!costBasis || costBasis <= 0) return nothing;

  const profitPerUnit = price - costBasis;
  const margin = price > 0 ? (profitPerUnit / price) * 100 : 0;
  const totalPL = profitPerUnit * quantity;

  return html`
    <div class="profit-summary">
      <div style="color: ${profitPerUnit >= 0 ? "var(--wa-color-success-text)" : "var(--wa-color-danger-text)"}">
        P/L per unit: $${profitPerUnit.toFixed(2)}
      </div>
      <div>Margin: ${margin.toFixed(1)}%</div>
      <div style="color: ${totalPL >= 0 ? "var(--wa-color-success-text)" : "var(--wa-color-danger-text)"}">
        Total P/L: $${totalPL.toFixed(2)}
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
            <span>Low: ${p.lowPrice != null ? `$${p.lowPrice.toFixed(2)}` : "—"}</span>
            <span>Mid: ${p.midPrice != null ? `$${p.midPrice.toFixed(2)}` : "—"}</span>
            <span>Market: ${p.marketPrice != null ? `$${p.marketPrice.toFixed(2)}` : "—"}</span>
          </div>
        `,
      )}
    </div>
  `;
}

// Re-export types for convenience
export type { InventoryItem, ProductSearchResult, ProductPrice };
