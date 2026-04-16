import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
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

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
}
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import '../../components/ogs-page.ts';
import { execute } from '../../lib/graphql.ts';
import { graphql } from '../../graphql/index.ts';
import { OrderStatus } from '../../graphql/graphql.ts';
import { formatCurrency } from '../../lib/currency.ts';
import type WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import { debounce } from '../../lib/debounce';

// --- Types ---

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  condition: string;
  quantity: number;
  unitPrice: number;
  costBasis: number | null;
  profit: number | null;
  lotId: number | null;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  totalCostBasis: number | null;
  totalProfit: number | null;
  createdAt: string;
  items: OrderItem[];
}

// --- GraphQL ---

const GetOrdersQuery = graphql(`
  query GetOrders($pagination: PaginationInput, $filters: OrderFilters) {
    getOrders(pagination: $pagination, filters: $filters) {
      items {
        id
        orderNumber
        customerName
        status
        totalAmount
        totalCostBasis
        totalProfit
        createdAt
        items {
          id
          productId
          productName
          condition
          quantity
          unitPrice
          costBasis
          profit
          lotId
        }
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`);

const CancelOrderMutation = graphql(`
  mutation CancelOrder($orderId: Int!) {
    cancelOrder(orderId: $orderId) {
      order {
        id
        orderNumber
        customerName
        status
        totalAmount
        totalCostBasis
        totalProfit
        createdAt
        items {
          id
          productId
          productName
          condition
          quantity
          unitPrice
          costBasis
          profit
        }
      }
      error
    }
  }
`);

const UpdateOrderStatusMutation = graphql(`
  mutation UpdateOrderStatus($orderId: Int!, $status: OrderStatus!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      order {
        id
        orderNumber
        customerName
        status
        totalAmount
        totalCostBasis
        totalProfit
        createdAt
        items {
          id
          productId
          productName
          condition
          quantity
          unitPrice
          costBasis
          profit
        }
      }
      error
    }
  }
`);

@customElement('ogs-orders-page')
export class OrdersPage extends LitElement {
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean })
  canManageLots = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;
  @property({ type: String }) activeOrganizationId = '';
  @property({ type: Boolean }) showStoreSelector = false;

  @state() orders: Order[] = [];
  @state() loading = true;
  @state() error = '';
  @state() page = 1;
  @state() pageSize = 25;
  @state() totalCount = 0;
  @state() totalPages = 0;
  @state() expandedOrderId: number | null = null;
  @state() cancellingOrderId: number | null = null;
  @state() updatingStatusOrderId: number | null = null;
  @state() pendingCancelOrder: Order | null = null;
  @state() showCancelDialog = false;

  // Filter state
  @state() private statusFilter = '';
  @state() private searchTerm = '';

  private debouncedSearch = debounce(() => {
    this.page = 1;
    this.fetchOrders();
  }, 300);

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

      .stat-icon.danger {
        background: var(--wa-color-danger-container);
        color: var(--wa-color-danger-text);
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

      /* --- Table --- */

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

      .actions-cell {
        white-space: nowrap;
      }

      /* --- Order Row --- */

      .order-row {
        cursor: pointer;
      }

      .order-row[expanded] td {
        background: var(--wa-color-surface-sunken);
      }

      .order-items-row td {
        padding: 0 !important;
        border-bottom: 2px solid var(--wa-color-surface-border) !important;
      }

      .order-items-container {
        padding: 0.75rem 1rem 1rem 3rem;
      }

      .order-items-table {
        width: 100%;
        border-collapse: collapse;
      }

      .order-items-table th {
        text-align: left;
        padding: 0.5rem 0.75rem;
        font-size: var(--wa-font-size-2xs);
        font-weight: 600;
        color: var(--wa-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .order-items-table td {
        padding: 0.5rem 0.75rem;
        font-size: var(--wa-font-size-2xs);
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .order-items-table tr:last-child td {
        border-bottom: none;
      }

      .expand-icon {
        transition: transform 0.2s ease;
        display: inline-block;
      }

      .expand-icon[rotated] {
        transform: rotate(90deg);
      }

      .status-badge {
        text-transform: capitalize;
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

      /* --- Cancel Dialog --- */

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

      wa-dialog::part(body) {
        max-height: 70vh;
        overflow-y: auto;
      }

      wa-dialog::part(title) {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.loadFiltersFromUrl();
    this.fetchOrders();
  }

  private loadFiltersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    this.searchTerm = params.get('search') ?? '';
    this.statusFilter = params.get('status') ?? '';
    const page = params.get('page');
    if (page) this.page = Number.parseInt(page, 10) || 1;
  }

  private updateQueryParams() {
    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value: string) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    };
    setOrDelete('search', this.searchTerm);
    setOrDelete('status', this.statusFilter);
    if (this.page > 1) {
      url.searchParams.set('page', String(this.page));
    } else {
      url.searchParams.delete('page');
    }
    window.history.replaceState(null, '', url.toString());
  }

  async fetchOrders() {
    this.loading = true;
    this.error = '';
    this.updateQueryParams();

    try {
      const result = await execute(GetOrdersQuery, {
        pagination: { page: this.page, pageSize: this.pageSize },
        filters: {
          ...(this.statusFilter ? { status: this.statusFilter as OrderStatus } : {}),
          ...(this.searchTerm ? { searchTerm: this.searchTerm } : {}),
        },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = result.data.getOrders;
        this.orders = data.items as Order[];
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load orders';
    } finally {
      this.loading = false;
    }
  }

  private toggleOrderExpand(orderId: number) {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  private formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  }

  private openCancelDialog(order: Order, event: Event) {
    event.stopPropagation();
    this.pendingCancelOrder = order;
    this.showCancelDialog = true;
  }

  private closeCancelDialog() {
    this.showCancelDialog = false;
    this.pendingCancelOrder = null;
  }

  private async confirmCancelOrder() {
    if (!this.pendingCancelOrder || this.cancellingOrderId) return;
    const orderId = this.pendingCancelOrder.id;
    this.cancellingOrderId = orderId;

    try {
      const result = await execute(CancelOrderMutation, { orderId });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = result.data.cancelOrder;
        if (data.error) {
          this.error = data.error;
        } else if (data.order) {
          this.orders = this.orders.map((o) => (o.id === data.order!.id ? data.order! : o)) as Order[];
        }
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to cancel order';
    } finally {
      this.cancellingOrderId = null;
      this.closeCancelDialog();
    }
  }

  private async handleUpdateStatus(orderId: number, newStatus: string, event: Event) {
    event.stopPropagation();
    if (this.updatingStatusOrderId) return;
    this.updatingStatusOrderId = orderId;

    try {
      const result = await execute(UpdateOrderStatusMutation, { orderId, status: newStatus as OrderStatus });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = result.data.updateOrderStatus;
        if (data.error) {
          this.error = data.error;
        } else if (data.order) {
          this.orders = this.orders.map((o) => (o.id === data.order!.id ? data.order! : o)) as Order[];
        }
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to update order status';
    } finally {
      this.updatingStatusOrderId = null;
    }
  }

  private goToPage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.fetchOrders();
  }

  private handleSearchInput(event: Event) {
    const input = event.target as WaInput;
    this.searchTerm = input.value as string;
    this.debouncedSearch();
  }

  private handleStatusFilterChange(event: Event) {
    const select = event.target as WaSelect;
    this.statusFilter = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);
    this.page = 1;
    this.fetchOrders();
  }

  // --- Stats computation ---

  private computeOrderStats() {
    let totalOrders = this.totalCount;
    let openCount = 0;
    let completedCount = 0;
    let totalRevenue = 0;
    let totalProfit = 0;

    for (const order of this.orders) {
      if (order.status === 'open') openCount++;
      if (order.status === 'completed') completedCount++;
      totalRevenue += order.totalAmount;
      if (order.totalProfit != null) totalProfit += order.totalProfit;
    }

    return { totalOrders, openCount, completedCount, totalRevenue, totalProfit };
  }

  render() {
    return html`
      <ogs-page
        activePage="Orders"
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
        activeOrganizationId="${this.activeOrganizationId}"
        ?showStoreSelector="${this.showStoreSelector}"
        @store-changed="${() => this.fetchOrders()}"
      >
        ${this.renderPageHeader()} ${this.renderStatsBar()} ${this.renderFilterBar()}
        ${when(
          this.error,
          () => html`
            <wa-callout variant="danger">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.error}
            </wa-callout>
          `,
        )}
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading orders...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
        ${this.renderCancelDialog()}
      </ogs-page>
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="receipt" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Orders</h2>
          <p>View and manage customer orders</p>
        </div>
      </div>
    `;
  }

  private renderStatsBar() {
    const stats = this.computeOrderStats();
    return html`
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon neutral">
            <wa-icon name="receipt"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total</span>
            <span class="stat-value">${stats.totalOrders}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <wa-icon name="clock"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Open</span>
            <span class="stat-value">${stats.openCount}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <wa-icon name="check"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Revenue</span>
            <span class="stat-value">${formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon ${stats.totalProfit >= 0 ? 'success' : 'danger'}">
            <wa-icon name="${stats.totalProfit >= 0 ? 'arrow-trend-up' : 'arrow-trend-down'}"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Profit</span>
            <span class="stat-value">${formatCurrency(stats.totalProfit)}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderFilterBar() {
    return html`
      <div class="filter-bar">
        <wa-input
          placeholder="Search by order # or customer..."
          .value="${this.searchTerm}"
          @input="${this.handleSearchInput}"
          clearable
        >
          <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
        </wa-input>
        <wa-select
          placeholder="Status"
          .value="${this.statusFilter}"
          @change="${this.handleStatusFilterChange}"
          clearable
        >
          <wa-option value="">All Statuses</wa-option>
          <wa-option value="open">Open</wa-option>
          <wa-option value="completed">Completed</wa-option>
          <wa-option value="cancelled">Cancelled</wa-option>
        </wa-select>
      </div>
    `;
  }

  private renderContent() {
    if (this.orders.length === 0) {
      return html`
        <div class="empty-state">
          <wa-icon name="receipt"></wa-icon>
          <h3>No Orders Yet</h3>
          <p>Orders will appear here once customers submit them through the shopping cart.</p>
        </div>
      `;
    }

    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table">
            <thead>
              <tr>
                <th style="width: 30px;"></th>
                <th scope="col">Order #</th>
                <th scope="col">Customer</th>
                <th scope="col">Items</th>
                <th scope="col" class="price-cell">Total</th>
                <th scope="col" class="price-cell">Cost</th>
                <th scope="col" class="price-cell">Profit</th>
                <th scope="col">Status</th>
                <th scope="col">Date</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.orders.map((order) => this.renderOrderRow(order))}
            </tbody>
          </table>
        </div>
      </wa-card>
      ${this.renderPagination()}
    `;
  }

  private renderOrderRow(order: Order) {
    const isExpanded = this.expandedOrderId === order.id;
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

    return html`
      <tr class="order-row" ?expanded="${isExpanded}" @click="${() => this.toggleOrderExpand(order.id)}">
        <td>
          <wa-icon
            class="expand-icon"
            name="chevron-right"
            ?rotated="${isExpanded}"
            style="font-size: var(--wa-font-size-s);"
          ></wa-icon>
        </td>
        <td><strong>${order.orderNumber}</strong></td>
        <td>${order.customerName}</td>
        <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
        <td class="price-cell"><strong>${formatCurrency(order.totalAmount)}</strong></td>
        <td class="price-cell">${formatCurrency(order.totalCostBasis)}</td>
        <td
          class="price-cell"
          style="${order.totalProfit != null && order.totalProfit > 0
            ? 'color: var(--wa-color-success-text);'
            : order.totalProfit != null && order.totalProfit < 0
              ? 'color: var(--wa-color-danger-text);'
              : ''}"
        >
          ${formatCurrency(order.totalProfit)}
        </td>
        <td>
          <wa-badge
            class="status-badge"
            variant="${order.status === 'completed'
              ? 'success'
              : order.status === 'cancelled'
                ? 'danger'
                : order.status === 'open'
                  ? 'brand'
                  : 'neutral'}"
          >
            ${order.status}
          </wa-badge>
        </td>
        <td>${this.formatDate(order.createdAt)}</td>
        <td class="actions-cell">
          ${order.status !== 'cancelled'
            ? html`
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  ${order.status === 'open'
                    ? html`
                        <wa-button
                          size="small"
                          variant="success"
                          appearance="outlined"
                          ?loading="${this.updatingStatusOrderId === order.id}"
                          ?disabled="${this.updatingStatusOrderId !== null}"
                          @click="${(e: Event) => this.handleUpdateStatus(order.id, 'completed', e)}"
                        >
                          <wa-icon slot="start" name="check"></wa-icon>
                          Complete
                        </wa-button>
                      `
                    : html`
                        <wa-button
                          size="small"
                          variant="neutral"
                          appearance="outlined"
                          ?loading="${this.updatingStatusOrderId === order.id}"
                          ?disabled="${this.updatingStatusOrderId !== null}"
                          @click="${(e: Event) => this.handleUpdateStatus(order.id, 'open', e)}"
                        >
                          <wa-icon slot="start" name="rotate-left"></wa-icon>
                          Re-open
                        </wa-button>
                      `}
                  ${order.status !== 'completed'
                    ? html`
                        <wa-button
                          size="small"
                          variant="danger"
                          appearance="outlined"
                          ?loading="${this.cancellingOrderId === order.id}"
                          ?disabled="${this.cancellingOrderId !== null}"
                          @click="${(e: Event) => this.openCancelDialog(order, e)}"
                        >
                          <wa-icon slot="start" name="xmark"></wa-icon>
                          Cancel
                        </wa-button>
                      `
                    : nothing}
                </div>
              `
            : nothing}
        </td>
      </tr>
      ${isExpanded
        ? html`
            <tr class="order-items-row">
              <td colspan="10">
                <div class="order-items-container">
                  <table class="order-items-table">
                    <thead>
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col">Condition</th>
                        <th scope="col" class="price-cell">Unit Price</th>
                        <th scope="col" class="price-cell">Cost Basis</th>
                        <th scope="col" class="price-cell">Qty</th>
                        <th scope="col" class="price-cell">Subtotal</th>
                        <th scope="col" class="price-cell">Profit</th>
                        <th scope="col">Lot</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${order.items.map(
                        (item) => html`
                          <tr>
                            <td>${item.productName}</td>
                            <td>${item.condition}</td>
                            <td class="price-cell">${formatCurrency(item.unitPrice)}</td>
                            <td class="price-cell">${formatCurrency(item.costBasis)}</td>
                            <td class="price-cell">${item.quantity}</td>
                            <td class="price-cell">${formatCurrency(item.unitPrice * item.quantity)}</td>
                            <td
                              class="price-cell"
                              style="${item.profit != null && item.profit > 0
                                ? 'color: var(--wa-color-success-text);'
                                : item.profit != null && item.profit < 0
                                  ? 'color: var(--wa-color-danger-text);'
                                  : ''}"
                            >
                              ${formatCurrency(item.profit)}
                            </td>
                            <td>
                              ${item.lotId
                                ? html`<a href="/lots/${item.lotId}" @click="${(e: Event) => e.stopPropagation()}"
                                    >#${item.lotId}</a
                                  >`
                                : '-'}
                            </td>
                          </tr>
                        `,
                      )}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          `
        : nothing}
    `;
  }

  private renderCancelDialog() {
    const order = this.pendingCancelOrder;
    const itemCount = order ? order.items.reduce((sum, i) => sum + i.quantity, 0) : 0;

    return html`
      <wa-dialog label="Cancel Order" ?open="${this.showCancelDialog}" @wa-after-hide="${this.closeCancelDialog}">
        ${order
          ? html`
              <div class="delete-warning">
                <wa-icon name="triangle-exclamation"></wa-icon>
                <div class="delete-warning-text">
                  <p>Cancel order <strong>${order.orderNumber}</strong>?</p>
                  <p>
                    This will return ${itemCount} item${itemCount !== 1 ? 's' : ''} back to inventory and mark the order
                    as cancelled. This action cannot be undone.
                  </p>
                </div>
              </div>
            `
          : nothing}
        <wa-button autofocus slot="footer" variant="neutral" @click="${this.closeCancelDialog}">Keep Order</wa-button>
        <wa-button
          slot="footer"
          variant="danger"
          ?loading="${this.cancellingOrderId !== null}"
          @click="${this.confirmCancelOrder}"
        >
          <wa-icon slot="start" name="xmark"></wa-icon>
          Cancel Order
        </wa-button>
      </wa-dialog>
    `;
  }

  private renderPagination() {
    if (this.totalPages <= 0) return nothing;

    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalCount);

    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.page - Math.floor(maxVisible / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return html`
      <div class="pagination">
        <span class="pagination-info">Showing ${start}–${end} of ${this.totalCount} orders</span>
        <div class="pagination-controls">
          ${when(
            this.totalPages > 1,
            () => html`
              <div class="pagination-buttons">
                <wa-button
                  size="small"
                  variant="neutral"
                  ?disabled="${this.page === 1}"
                  @click="${() => this.goToPage(this.page - 1)}"
                >
                  <wa-icon name="chevron-left"></wa-icon>
                </wa-button>
                ${pages.map(
                  (p) => html`
                    <wa-button
                      size="small"
                      variant="${p === this.page ? 'brand' : 'neutral'}"
                      ?data-current="${p === this.page}"
                      @click="${() => this.goToPage(p)}"
                    >
                      ${p}
                    </wa-button>
                  `,
                )}
                <wa-button
                  size="small"
                  variant="neutral"
                  ?disabled="${this.page === this.totalPages}"
                  @click="${() => this.goToPage(this.page + 1)}"
                >
                  <wa-icon name="chevron-right"></wa-icon>
                </wa-button>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }
}
