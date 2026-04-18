import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
}
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import '../../components/ogs-page.ts';
import { execute } from '../../lib/graphql.ts';
import { graphql } from '../../graphql/index.ts';
import { formatCurrency } from '../../lib/currency.ts';
import { debounce } from '../../lib/debounce';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';

// --- Types ---

interface PosLineItem {
  inventoryItemId: number;
  productName: string;
  condition: string;
  unitPrice: number; // cents
  quantity: number;
  maxAvailable: number;
}

// --- GraphQL Operations ---

const LookupBarcodeQuery = graphql(`
  query LookupBarcode($code: String!) {
    lookupBarcode(code: $code) {
      inventoryItemId
      productName
      gameName
      setName
      condition
      price
      availableQuantity
      imageUrl
    }
  }
`);

const POSGetInventoryQuery = graphql(`
  query POSGetInventory($filters: InventoryFilters, $pagination: PaginationInput) {
    getInventory(filters: $filters, pagination: $pagination) {
      items {
        id
        productId
        productName
        gameName
        condition
        price
        totalQuantity
      }
    }
  }
`);

const GetOpenOrdersQuery = graphql(`
  query GetOpenOrders($pagination: PaginationInput, $filters: OrderFilters) {
    getOrders(pagination: $pagination, filters: $filters) {
      items {
        id
        orderNumber
        customerName
        totalAmount
        createdAt
        items {
          id
          productId
          productName
          condition
          quantity
          unitPrice
        }
      }
    }
  }
`);

const GetPosConfigQuery = graphql(`
  query GetPosConfig($stateCode: String) {
    getPosConfig(stateCode: $stateCode) {
      taxRate
      stripeEnabled
      stripePublishableKey
    }
  }
`);

const SubmitPosOrderMutation = graphql(`
  mutation SubmitPosOrder($input: SubmitPosOrderInput!) {
    submitPosOrder(input: $input) {
      id
      orderNumber
      totalAmount
      taxAmount
      paymentMethod
      status
    }
  }
`);

const CompletePosOrderMutation = graphql(`
  mutation CompletePosOrder($input: CompletePosOrderInput!) {
    completePosOrder(input: $input) {
      id
      orderNumber
      totalAmount
      taxAmount
      paymentMethod
      status
    }
  }
`);

const CreatePaymentIntentMutation = graphql(`
  mutation CreatePosPaymentIntent($amount: Int!) {
    createPosPaymentIntent(amount: $amount) {
      clientSecret
      paymentIntentId
    }
  }
`);

// --- Component ---

@customElement('ogs-pos-page')
export class PosPage extends LitElement {
  // --- SSR Properties ---
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean }) canManageLots = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;
  @property({ type: Boolean }) canUsePOS = false;
  @property({ type: String }) activeOrganizationId = '';

  // --- Line Items ---
  @state() lineItems: PosLineItem[] = [];
  @state() customerName = '';
  @state() taxRate = 0;
  @state() taxAmount = 0;
  @state() subtotal = 0;
  @state() paymentMethod: 'cash' | 'card' = 'cash';
  @state() stripeEnabled = false;
  @state() stripePublishableKey: string | null = null;

  // --- Barcode / Search ---
  @state() barcodeInput = '';
  @state() searchInput = '';
  @state() searchResults: any[] = [];
  @state() searchLoading = false;

  // --- Order Lookup ---
  @state() existingOrderId: number | null = null;
  @state() existingOrderItems: any[] = [];
  @state() showOrderSearch = false;
  @state() openOrders: any[] = [];
  @state() orderSearchTerm = '';

  // --- Processing ---
  @state() processing = false;
  @state() error = '';
  @state() success: { orderNumber: string; total: number } | null = null;

  // --- Cash ---
  @state() cashTendered = '';

  // --- Payment Intent tracking ---
  private pendingPaymentIntentId: string | null = null;

  private debouncedProductSearch = debounce(() => {
    this.performProductSearch();
  }, 300);

  // --- Input Handlers (avoid assignment-in-expression lint errors) ---

  private handleBarcodeInput(e: Event) {
    this.barcodeInput = (e.target as WaInput).value as string;
  }

  private handleCustomerNameInput(e: Event) {
    this.customerName = (e.target as WaInput).value as string;
  }

  private handleCashTenderedInput(e: Event) {
    this.cashTendered = (e.target as WaInput).value as string;
  }

  private handleOrderSearchInput(e: Event) {
    this.orderSearchTerm = (e.target as WaInput).value as string;
  }

  private selectPaymentCash() {
    this.paymentMethod = 'cash';
  }

  private selectPaymentCard() {
    this.paymentMethod = 'card';
  }

  static styles = [
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

      /* --- POS Layout --- */

      .pos-container {
        display: flex;
        gap: 1.5rem;
        min-height: calc(100vh - 200px);
      }

      .pos-left {
        flex: 3;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .pos-right {
        flex: 2;
        border-left: 1px solid var(--wa-color-surface-border);
        padding-left: 1.5rem;
        position: sticky;
        top: 80px;
        align-self: flex-start;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: calc(100vh - 200px);
        overflow-y: auto;
      }

      /* --- Input Sections --- */

      .input-section {
        position: relative;
      }

      .input-section wa-input {
        width: 100%;
      }

      /* --- Search Results Dropdown --- */

      .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-surface-raised);
        z-index: 100;
        box-shadow: 0 4px 12px var(--wa-color-shadow);
        margin-top: 0.25rem;
      }

      .search-result-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        cursor: pointer;
        transition: background-color 0.15s;
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .search-result-item:last-child {
        border-bottom: none;
      }

      .search-result-item:hover {
        background-color: var(--wa-color-surface-sunken);
      }

      .search-result-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        flex: 1;
        min-width: 0;
      }

      .search-result-info strong {
        font-size: var(--wa-font-size-s);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .search-result-info small {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-xs);
      }

      .search-result-price {
        font-weight: 600;
        font-size: var(--wa-font-size-s);
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      .search-result-qty {
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
        white-space: nowrap;
      }

      /* --- Line Items Table --- */

      .line-items-card {
        flex: 1;
      }

      .table-container {
        overflow-x: auto;
      }

      .wa-table {
        width: 100%;
        border-collapse: collapse;
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
        padding: 0.875rem 1rem;
        text-align: left;
        border-bottom: 2px solid var(--wa-color-surface-border);
      }

      .wa-table td {
        padding: 0.875rem 1rem;
        font-size: var(--wa-font-size-s);
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .wa-table tr:last-child td {
        border-bottom: none;
      }

      .wa-table tbody tr {
        transition: background 0.15s ease;
      }

      .wa-table tbody tr:hover td {
        background: var(--wa-color-surface-sunken);
      }

      .price-cell {
        text-align: right;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }

      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .quantity-controls wa-button {
        --wa-button-font-size-small: var(--wa-font-size-xs);
      }

      .quantity-controls span {
        min-width: 2rem;
        text-align: center;
        font-weight: 600;
      }

      .remove-btn {
        color: var(--wa-color-danger-text);
      }

      /* --- Right Panel --- */

      .customer-section {
        padding-bottom: 1rem;
      }

      .customer-section wa-input {
        width: 100%;
      }

      .totals-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
      }

      .totals-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--wa-font-size-s);
      }

      .totals-row.total {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
        padding-top: 0.5rem;
        border-top: 2px solid var(--wa-color-surface-border);
      }

      .totals-label {
        color: var(--wa-color-text-muted);
      }

      .totals-value {
        font-variant-numeric: tabular-nums;
      }

      /* --- Payment Section --- */

      .payment-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
      }

      .payment-section h3 {
        margin: 0;
        font-size: var(--wa-font-size-m);
        font-weight: 600;
      }

      .payment-method-buttons {
        display: flex;
        gap: 0.5rem;
      }

      .payment-method-buttons wa-button {
        flex: 1;
      }

      .cash-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .cash-section wa-input {
        width: 100%;
      }

      .change-due {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: var(--wa-color-success-container);
        border-radius: var(--wa-border-radius-m);
        font-weight: 600;
      }

      .change-due .label {
        color: var(--wa-color-success-text);
      }

      .change-due .value {
        font-size: var(--wa-font-size-l);
        color: var(--wa-color-success-text);
        font-variant-numeric: tabular-nums;
      }

      .stripe-placeholder {
        padding: 1rem;
        background: var(--wa-color-surface-sunken);
        border: 2px dashed var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        text-align: center;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      .stripe-placeholder wa-icon {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        display: block;
      }

      .process-btn {
        width: 100%;
        margin-top: 0.5rem;
      }

      .process-btn wa-button {
        width: 100%;
      }

      /* --- Success Screen --- */

      .success-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 3rem 2rem;
        gap: 1rem;
      }

      .success-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--wa-color-success-container);
        color: var(--wa-color-success-text);
        font-size: 2.5rem;
      }

      .success-screen h2 {
        margin: 0;
        font-size: var(--wa-font-size-2xl);
        font-weight: 700;
        color: var(--wa-color-success-text);
      }

      .success-screen .order-number {
        font-size: var(--wa-font-size-l);
        color: var(--wa-color-text-muted);
      }

      .success-screen .success-total {
        font-size: var(--wa-font-size-3xl);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      /* --- Empty State --- */

      .empty-line-items {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 3rem 2rem;
        color: var(--wa-color-text-muted);
        flex: 1;
      }

      .empty-line-items wa-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .empty-line-items h3 {
        margin: 0 0 0.25rem 0;
        font-size: var(--wa-font-size-l);
        color: var(--wa-color-text-normal);
      }

      .empty-line-items p {
        margin: 0;
        font-size: var(--wa-font-size-s);
      }

      /* --- Pull Order Button --- */

      .pull-order-section {
        padding-top: 0.5rem;
      }

      /* --- Order Search Dialog --- */

      .order-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-m);
        cursor: pointer;
        transition: all 0.15s;
      }

      .order-item:hover {
        background: var(--wa-color-surface-sunken);
        border-color: var(--wa-color-brand-text);
      }

      .order-item-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .order-item-info strong {
        font-size: var(--wa-font-size-s);
      }

      .order-item-info small {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-xs);
      }

      .order-item-total {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }

      /* --- Dialog Overrides --- */

      wa-dialog::part(body) {
        max-height: 70vh;
        overflow-y: auto;
      }

      wa-dialog::part(title) {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
      }

      /* --- Loading --- */

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
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.fetchPosConfig();
  }

  // --- Data Fetching ---

  private async fetchPosConfig() {
    try {
      const result = await execute(GetPosConfigQuery, { stateCode: null });
      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const config = result.data.getPosConfig;
        this.taxRate = config.taxRate;
        this.stripeEnabled = config.stripeEnabled;
        this.stripePublishableKey = config.stripePublishableKey ?? null;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load POS configuration';
    }
  }

  // --- Calculations ---

  private recalculateTotals() {
    this.subtotal = this.lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    this.taxAmount = Math.round(this.subtotal * this.taxRate);
  }

  private get total() {
    return this.subtotal + this.taxAmount;
  }

  private get changeDue(): number {
    const tendered = Math.round(Number.parseFloat(this.cashTendered || '0') * 100);
    return Math.max(0, tendered - this.total);
  }

  // --- Barcode Handling ---

  private async handleBarcodeScan(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    const code = this.barcodeInput.trim();
    if (!code) return;

    try {
      const result = await execute(LookupBarcodeQuery, { code });
      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
        return;
      }

      const item = result.data.lookupBarcode;
      if (!item) {
        this.error = `No item found for barcode: ${code}`;
        return;
      }

      this.error = '';
      this.addOrIncrementItem({
        inventoryItemId: item.inventoryItemId,
        productName: item.productName,
        condition: item.condition ?? '',
        unitPrice: item.price,
        maxAvailable: item.availableQuantity,
      });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Barcode lookup failed';
    } finally {
      this.barcodeInput = '';
      this.requestUpdate();
      await this.updateComplete;
      const barcodeInput = this.renderRoot.querySelector<WaInput>('.barcode-input');
      barcodeInput?.focus();
    }
  }

  // --- Product Search ---

  private handleSearchInput(event: Event) {
    const input = event.target as WaInput;
    this.searchInput = input.value as string;
    if (this.searchInput.trim().length >= 2) {
      this.debouncedProductSearch();
    } else {
      this.searchResults = [];
      this.searchLoading = false;
    }
  }

  private async performProductSearch() {
    if (!this.searchInput.trim()) return;
    this.searchLoading = true;

    try {
      const result = await execute(POSGetInventoryQuery, {
        filters: { searchTerm: this.searchInput.trim() },
        pagination: { page: 1, pageSize: 20 },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
        this.searchResults = [];
      } else {
        this.searchResults = result.data.getInventory.items;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Search failed';
      this.searchResults = [];
    } finally {
      this.searchLoading = false;
    }
  }

  private addItemFromSearch(inventoryItem: any) {
    this.addOrIncrementItem({
      inventoryItemId: inventoryItem.id,
      productName: inventoryItem.productName,
      condition: inventoryItem.condition ?? '',
      unitPrice: inventoryItem.price,
      maxAvailable: inventoryItem.totalQuantity,
    });
    this.searchResults = [];
    this.searchInput = '';
  }

  private addOrIncrementItem(item: {
    inventoryItemId: number;
    productName: string;
    condition: string;
    unitPrice: number;
    maxAvailable: number;
  }) {
    const existingIndex = this.lineItems.findIndex((li) => li.inventoryItemId === item.inventoryItemId);

    if (existingIndex >= 0) {
      const existing = this.lineItems[existingIndex];
      if (existing.quantity < existing.maxAvailable) {
        const updated = [...this.lineItems];
        updated[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        this.lineItems = updated;
      } else {
        this.error = `Cannot add more ${item.productName} — max available quantity reached`;
        return;
      }
    } else {
      this.lineItems = [
        ...this.lineItems,
        {
          inventoryItemId: item.inventoryItemId,
          productName: item.productName,
          condition: item.condition,
          unitPrice: item.unitPrice,
          quantity: 1,
          maxAvailable: item.maxAvailable,
        },
      ];
    }

    this.error = '';
    this.recalculateTotals();
  }

  // --- Line Item Management ---

  private updateItemQuantity(index: number, newQty: number) {
    if (newQty < 1) return;
    const item = this.lineItems[index];
    if (newQty > item.maxAvailable) {
      this.error = `Max available quantity for ${item.productName} is ${item.maxAvailable}`;
      return;
    }
    const updated = [...this.lineItems];
    updated[index] = { ...item, quantity: newQty };
    this.lineItems = updated;
    this.error = '';
    this.recalculateTotals();
  }

  private removeItem(index: number) {
    this.lineItems = this.lineItems.filter((_, i) => i !== index);
    this.recalculateTotals();
  }

  // --- Order Lookup ---

  private async openOrderSearchDialog() {
    this.showOrderSearch = true;
    this.orderSearchTerm = '';

    try {
      const result = await execute(GetOpenOrdersQuery, {
        pagination: { page: 1, pageSize: 50 },
        filters: { status: 'open' as any },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.openOrders = result.data.getOrders.items;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load open orders';
    }
  }

  private closeOrderSearchDialog() {
    this.showOrderSearch = false;
    this.openOrders = [];
  }

  private pullInOrder(order: any) {
    // Existing order items are displayed as read-only in the line items table.
    // Their stock was already decremented when the order was created.
    // The inventoryItemId is not available on order items (they snapshot product data),
    // so we use a negative sentinel to distinguish them from scannable items.
    this.lineItems = order.items.map((item: any, index: number) => ({
      inventoryItemId: -(index + 1), // negative sentinel — not a real inventory item
      productName: item.productName,
      condition: item.condition ?? '',
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      maxAvailable: item.quantity, // locked — cannot change existing order items
    }));
    this.customerName = order.customerName ?? '';
    this.existingOrderId = order.id;
    this.existingOrderItems = order.items.map((item: any, index: number) => ({
      ...item,
      inventoryItemId: -(index + 1), // match sentinel for filtering in handlePayment
    }));
    this.recalculateTotals();
    this.closeOrderSearchDialog();
  }

  // --- Payment ---

  private async handlePayment() {
    if (this.lineItems.length === 0) {
      this.error = 'Add items before processing payment';
      return;
    }

    this.processing = true;
    this.error = '';

    try {
      if (this.paymentMethod === 'card' && this.stripeEnabled) {
        // Create payment intent for card payments
        const piResult = await execute(CreatePaymentIntentMutation, { amount: this.total });
        if (piResult?.errors?.length) {
          this.error = piResult.errors.map((e: { message: string }) => e.message).join(', ');
          this.processing = false;
          return;
        }
        this.pendingPaymentIntentId = piResult.data.createPosPaymentIntent.paymentIntentId;

        // Placeholder: In production, Stripe Elements would handle card entry here.
        // For now, we proceed to submit the order with the payment intent ID.
        this.error =
          'Stripe card entry is not yet integrated. Please use cash payment or complete Stripe Elements integration.';
        this.processing = false;
        return;
      }

      // Cash payment or order submission
      const items = this.lineItems.map((li) => ({
        inventoryItemId: li.inventoryItemId,
        quantity: li.quantity,
      }));

      let result: any;
      if (this.existingOrderId) {
        // Determine which items are new (not from the pulled-in order)
        const existingIds = new Set(this.existingOrderItems.map((oi: any) => oi.inventoryItemId));
        const newItems = items.filter((i) => !existingIds.has(i.inventoryItemId));

        result = await execute(CompletePosOrderMutation, {
          input: {
            orderId: this.existingOrderId,
            newItems: newItems.length > 0 ? newItems : undefined,
            paymentMethod: this.paymentMethod,
            taxAmount: this.taxAmount,
          },
        });
        if (result?.errors?.length) {
          this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
        } else {
          const order = result.data.completePosOrder;
          this.success = { orderNumber: order.orderNumber, total: order.totalAmount };
        }
      } else {
        result = await execute(SubmitPosOrderMutation, {
          input: {
            customerName: this.customerName || '',
            paymentMethod: this.paymentMethod,
            taxAmount: this.taxAmount,
            items,
          },
        });
        if (result?.errors?.length) {
          this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
        } else {
          const order = result.data.submitPosOrder;
          this.success = { orderNumber: order.orderNumber, total: order.totalAmount };
        }
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Payment processing failed';
    } finally {
      this.processing = false;
    }
  }

  private resetTransaction() {
    this.lineItems = [];
    this.customerName = '';
    this.subtotal = 0;
    this.taxAmount = 0;
    this.paymentMethod = 'cash';
    this.barcodeInput = '';
    this.searchInput = '';
    this.searchResults = [];
    this.searchLoading = false;
    this.existingOrderId = null;
    this.existingOrderItems = [];
    this.processing = false;
    this.error = '';
    this.success = null;
    this.cashTendered = '';
    this.pendingPaymentIntentId = null;
  }

  // --- Render ---

  render() {
    return html`
      <ogs-page
        activePage="POS"
        ?showUserMenu="${true}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
        ?canManageInventory="${this.canManageInventory}"
        ?canManageLots="${this.canManageLots}"
        ?canViewDashboard="${this.canViewDashboard}"
        ?canAccessSettings="${this.canAccessSettings}"
        ?canManageStoreLocations="${this.canManageStoreLocations}"
        ?canManageUsers="${this.canManageUsers}"
        ?canViewTransactionLog="${this.canViewTransactionLog}"
        ?canUsePOS="${this.canUsePOS}"
        activeOrganizationId="${this.activeOrganizationId}"
      >
        ${when(
          this.success,
          () => this.renderSuccessScreen(),
          () => html`
            ${this.renderPageHeader()}
            ${when(
              this.error,
              () => html`
                <wa-callout variant="danger" style="margin-bottom: 1rem;">
                  <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                  ${this.error}
                </wa-callout>
              `,
            )}
            <div class="pos-container">
              <div class="pos-left">
                ${this.renderBarcodeInput()} ${this.renderProductSearch()} ${this.renderLineItems()}
                ${this.renderPullOrderSection()}
              </div>
              <div class="pos-right">
                ${this.renderCustomerSection()} ${this.renderTotals()} ${this.renderPaymentSection()}
              </div>
            </div>
            ${this.renderOrderSearchDialog()}
          `,
        )}
      </ogs-page>
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="cash-register" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Point of Sale</h2>
          <p>Process in-store transactions</p>
        </div>
        ${when(this.existingOrderId, () => html` <wa-badge variant="brand"> Completing Order </wa-badge> `)}
      </div>
    `;
  }

  private renderBarcodeInput() {
    return html`
      <div class="input-section">
        <wa-input
          class="barcode-input"
          placeholder="Scan barcode or enter code..."
          .value="${this.barcodeInput}"
          @input="${this.handleBarcodeInput}"
          @keydown="${this.handleBarcodeScan}"
          autofocus
        >
          <wa-icon slot="prefix" name="barcode"></wa-icon>
        </wa-input>
      </div>
    `;
  }

  private renderProductSearch() {
    return html`
      <div class="input-section">
        <wa-input
          placeholder="Search products by name..."
          .value="${this.searchInput}"
          @input="${this.handleSearchInput}"
          clearable
          @wa-clear="${() => {
            this.searchInput = '';
            this.searchResults = [];
          }}"
        >
          <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
          ${when(this.searchLoading, () => html`<wa-spinner slot="suffix"></wa-spinner>`)}
        </wa-input>
        ${when(
          this.searchResults.length > 0,
          () => html`
            <div class="search-results">
              ${this.searchResults.map(
                (item) => html`
                  <div class="search-result-item" @click="${() => this.addItemFromSearch(item)}">
                    <div class="search-result-info">
                      <strong>${item.productName}</strong>
                      <small>${item.gameName ?? ''}${item.condition ? ` — ${item.condition}` : ''}</small>
                    </div>
                    <span class="search-result-price">${formatCurrency(item.price)}</span>
                    <span class="search-result-qty">${item.totalQuantity} avail.</span>
                  </div>
                `,
              )}
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderLineItems() {
    if (this.lineItems.length === 0) {
      return html`
        <div class="empty-line-items">
          <wa-icon name="cart-shopping"></wa-icon>
          <h3>No items yet</h3>
          <p>Scan a barcode or search for products to add items</p>
        </div>
      `;
    }

    return html`
      <wa-card class="line-items-card" appearance="outline">
        <div class="table-container">
          <table class="wa-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Condition</th>
                <th scope="col">Qty</th>
                <th scope="col" class="price-cell">Price</th>
                <th scope="col" class="price-cell">Line Total</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              ${this.lineItems.map((item, index) => this.renderLineItemRow(item, index))}
            </tbody>
          </table>
        </div>
      </wa-card>
    `;
  }

  private renderLineItemRow(item: PosLineItem, index: number) {
    return html`
      <tr>
        <td><strong>${item.productName}</strong></td>
        <td>${item.condition || '—'}</td>
        <td>
          <div class="quantity-controls">
            <wa-button
              size="small"
              variant="neutral"
              appearance="outlined"
              ?disabled="${item.quantity <= 1}"
              @click="${() => this.updateItemQuantity(index, item.quantity - 1)}"
            >
              <wa-icon name="minus"></wa-icon>
            </wa-button>
            <span>${item.quantity}</span>
            <wa-button
              size="small"
              variant="neutral"
              appearance="outlined"
              ?disabled="${item.quantity >= item.maxAvailable}"
              @click="${() => this.updateItemQuantity(index, item.quantity + 1)}"
            >
              <wa-icon name="plus"></wa-icon>
            </wa-button>
          </div>
        </td>
        <td class="price-cell">${formatCurrency(item.unitPrice)}</td>
        <td class="price-cell"><strong>${formatCurrency(item.unitPrice * item.quantity)}</strong></td>
        <td>
          <wa-button
            size="small"
            variant="danger"
            appearance="text"
            class="remove-btn"
            @click="${() => this.removeItem(index)}"
          >
            <wa-icon name="trash"></wa-icon>
          </wa-button>
        </td>
      </tr>
    `;
  }

  private renderPullOrderSection() {
    return html`
      <div class="pull-order-section">
        <wa-button variant="neutral" appearance="outlined" @click="${this.openOrderSearchDialog}">
          <wa-icon slot="start" name="file-import"></wa-icon>
          Pull in Existing Order
        </wa-button>
      </div>
    `;
  }

  private renderCustomerSection() {
    return html`
      <div class="customer-section">
        <wa-input
          label="Customer Name"
          placeholder="Walk-in customer"
          .value="${this.customerName}"
          @input="${this.handleCustomerNameInput}"
        >
          <wa-icon slot="prefix" name="user"></wa-icon>
        </wa-input>
      </div>
    `;
  }

  private renderTotals() {
    const taxPercent = (this.taxRate * 100).toFixed(2);

    return html`
      <div class="totals-section">
        <div class="totals-row">
          <span class="totals-label">Subtotal</span>
          <span class="totals-value">${formatCurrency(this.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span class="totals-label">Tax (${taxPercent}%)</span>
          <span class="totals-value">${formatCurrency(this.taxAmount)}</span>
        </div>
        <wa-divider></wa-divider>
        <div class="totals-row total">
          <span>Total</span>
          <span class="totals-value">${formatCurrency(this.total)}</span>
        </div>
      </div>
    `;
  }

  private renderPaymentSection() {
    return html`
      <div class="payment-section">
        <h3>Payment Method</h3>
        <div class="payment-method-buttons">
          <wa-button
            variant="${this.paymentMethod === 'cash' ? 'brand' : 'neutral'}"
            appearance="${this.paymentMethod === 'cash' ? 'filled' : 'outlined'}"
            @click="${this.selectPaymentCash}"
          >
            <wa-icon slot="start" name="money-bill"></wa-icon>
            Cash
          </wa-button>
          ${when(
            this.stripeEnabled,
            () => html`
              <wa-button
                variant="${this.paymentMethod === 'card' ? 'brand' : 'neutral'}"
                appearance="${this.paymentMethod === 'card' ? 'filled' : 'outlined'}"
                @click="${this.selectPaymentCard}"
              >
                <wa-icon slot="start" name="credit-card"></wa-icon>
                Card
              </wa-button>
            `,
          )}
        </div>

        ${when(
          this.paymentMethod === 'cash',
          () => this.renderCashSection(),
          () => this.renderCardSection(),
        )}

        <div class="process-btn">
          <wa-button
            variant="success"
            size="large"
            ?loading="${this.processing}"
            ?disabled="${this.processing || this.lineItems.length === 0}"
            @click="${this.handlePayment}"
          >
            <wa-icon slot="start" name="check"></wa-icon>
            Process Payment — ${formatCurrency(this.total)}
          </wa-button>
        </div>
      </div>
    `;
  }

  private renderCashSection() {
    return html`
      <div class="cash-section">
        <wa-input
          label="Amount Tendered"
          type="number"
          placeholder="0.00"
          .value="${this.cashTendered}"
          @input="${this.handleCashTenderedInput}"
        >
          <span slot="prefix">$</span>
        </wa-input>
        ${when(
          this.cashTendered && Number.parseFloat(this.cashTendered) > 0,
          () => html`
            <div class="change-due">
              <span class="label">Change Due</span>
              <span class="value">${formatCurrency(this.changeDue)}</span>
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderCardSection() {
    return html`
      <div class="stripe-placeholder">
        <wa-icon name="credit-card"></wa-icon>
        <p>Stripe card entry will appear here</p>
        ${when(this.pendingPaymentIntentId, () => html`<small>Payment Intent: ${this.pendingPaymentIntentId}</small>`)}
      </div>
    `;
  }

  private renderSuccessScreen() {
    return html`
      <div class="success-screen">
        <div class="success-icon">
          <wa-icon name="check"></wa-icon>
        </div>
        <h2>Payment Complete</h2>
        <span class="order-number">Order ${this.success!.orderNumber}</span>
        <span class="success-total">${formatCurrency(this.success!.total)}</span>
        <wa-button variant="brand" size="large" @click="${this.resetTransaction}">
          <wa-icon slot="start" name="plus"></wa-icon>
          New Transaction
        </wa-button>
      </div>
    `;
  }

  private renderOrderSearchDialog() {
    const filteredOrders = this.orderSearchTerm
      ? this.openOrders.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(this.orderSearchTerm.toLowerCase()) ||
            (o.customerName && o.customerName.toLowerCase().includes(this.orderSearchTerm.toLowerCase())),
        )
      : this.openOrders;

    return html`
      <wa-dialog
        label="Pull in Existing Order"
        ?open="${this.showOrderSearch}"
        @wa-after-hide="${this.closeOrderSearchDialog}"
      >
        <wa-input
          placeholder="Search by order # or customer..."
          .value="${this.orderSearchTerm}"
          @input="${this.handleOrderSearchInput}"
          style="margin-bottom: 1rem;"
        >
          <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
        </wa-input>

        ${when(
          filteredOrders.length === 0,
          () => html` <p style="text-align: center; color: var(--wa-color-text-muted);">No open orders found</p> `,
          () => html`
            <div class="order-list">
              ${filteredOrders.map(
                (order) => html`
                  <div class="order-item" @click="${() => this.pullInOrder(order)}">
                    <div class="order-item-info">
                      <strong>${order.orderNumber}</strong>
                      <small
                        >${order.customerName || 'Walk-in'} — ${order.items.length}
                        item${order.items.length !== 1 ? 's' : ''}</small
                      >
                    </div>
                    <span class="order-item-total">${formatCurrency(order.totalAmount)}</span>
                  </div>
                `,
              )}
            </div>
          `,
        )}

        <wa-button slot="footer" variant="neutral" @click="${this.closeOrderSearchDialog}">Close</wa-button>
      </wa-dialog>
    `;
  }
}
