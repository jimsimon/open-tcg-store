import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
}
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import '../../components/ogs-page.ts';
import { execute } from '../../lib/graphql.ts';
import { TypedDocumentString } from '../../graphql/graphql.ts';

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

const GetOrdersQuery = new TypedDocumentString(`
  query GetOrders($pagination: PaginationInput) {
    getOrders(pagination: $pagination) {
      orders {
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
      totalCount
      page
      pageSize
      totalPages
    }
  }
`) as unknown as TypedDocumentString<
  {
    getOrders: {
      orders: Order[];
      totalCount: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  },
  { pagination?: { page?: number; pageSize?: number } }
>;

const CancelOrderMutation = new TypedDocumentString(`
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
`) as unknown as TypedDocumentString<
  {
    cancelOrder: {
      order?: Order;
      error?: string;
    };
  },
  { orderId: number }
>;

const UpdateOrderStatusMutation = new TypedDocumentString(`
  mutation UpdateOrderStatus($orderId: Int!, $status: String!) {
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
`) as unknown as TypedDocumentString<
  {
    updateOrderStatus: {
      order?: Order;
      error?: string;
    };
  },
  { orderId: number; status: string }
>;

@customElement('ogs-orders-page')
export class OrdersPage extends LitElement {
  @property({ type: String }) userRole = '';
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';

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

      .placeholder {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--wa-color-text-muted);
      }

      .placeholder wa-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .placeholder h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-text-normal);
      }

      .placeholder p {
        margin: 0;
        max-width: 400px;
        margin-inline: auto;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        padding: 3rem;
      }

      .orders-table {
        width: 100%;
        border-collapse: collapse;
      }

      .orders-table th {
        text-align: left;
        padding: 0.75rem 1rem;
        font-size: var(--wa-font-size-s);
        font-weight: 600;
        color: var(--wa-color-text-muted);
        border-bottom: 2px solid var(--wa-color-surface-border);
      }

      .orders-table td {
        padding: 0.75rem 1rem;
        font-size: var(--wa-font-size-s);
        border-bottom: 1px solid var(--wa-color-surface-border);
        vertical-align: top;
      }

      .orders-table tr.order-row {
        cursor: pointer;
        transition: background-color 0.15s ease;
      }

      .orders-table tr.order-row:hover {
        background: var(--wa-color-surface-sunken);
      }

      .orders-table tr.order-row[expanded] {
        background: var(--wa-color-surface-sunken);
      }

      .order-items-row td {
        padding: 0;
        border-bottom: 2px solid var(--wa-color-surface-border);
      }

      .order-items-container {
        padding: 0.5rem 1rem 1rem 3rem;
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
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .order-items-table td {
        padding: 0.5rem 0.75rem;
        font-size: var(--wa-font-size-2xs);
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .price-cell {
        text-align: right;
      }

      .expand-icon {
        transition: transform 0.2s ease;
        display: inline-block;
      }

      .expand-icon[rotated] {
        transform: rotate(90deg);
      }

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
      }

      .pagination-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .status-badge {
        text-transform: capitalize;
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.fetchOrders();
  }

  async fetchOrders() {
    this.loading = true;
    this.error = '';

    try {
      const result = await execute(GetOrdersQuery, {
        pagination: { page: this.page, pageSize: this.pageSize },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = result.data.getOrders;
        this.orders = data.orders;
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
    event.stopPropagation(); // Prevent row expand toggle
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
          // Update the order in the local list
          this.orders = this.orders.map((o) => (o.id === data.order!.id ? data.order! : o));
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
      const result = await execute(UpdateOrderStatusMutation, { orderId, status: newStatus });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = result.data.updateOrderStatus;
        if (data.error) {
          this.error = data.error;
        } else if (data.order) {
          this.orders = this.orders.map((o) => (o.id === data.order!.id ? data.order! : o));
        }
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to update order status';
    } finally {
      this.updatingStatusOrderId = null;
    }
  }

  private goToPage(newPage: number) {
    this.page = newPage;
    this.fetchOrders();
  }

  render() {
    return html`
      <ogs-page
        activePage="Orders"
        ?showUserMenu="${true}"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
      >
        <div class="page-header">
          <div class="page-header-icon">
            <wa-icon name="receipt" style="font-size: 1.5rem;"></wa-icon>
          </div>
          <div class="page-header-content">
            <h2>Orders</h2>
            <p>View and manage customer orders</p>
          </div>
        </div>

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

  private renderContent() {
    if (this.error) {
      return html`<div class="placeholder">
        <wa-icon name="circle-exclamation"></wa-icon>
        <h3>Error</h3>
        <p>${this.error}</p>
      </div>`;
    }

    if (this.orders.length === 0) {
      return html`
        <div class="placeholder">
          <wa-icon name="receipt"></wa-icon>
          <h3>No Orders Yet</h3>
          <p>Orders will appear here once customers submit them through the shopping cart.</p>
        </div>
      `;
    }

    return html`
      <table class="orders-table">
        <thead>
          <tr>
            <th style="width: 30px;"></th>
            <th>Order #</th>
            <th>Customer</th>
            <th>Items</th>
            <th class="price-cell">Total</th>
            <th class="price-cell">Cost</th>
            <th class="price-cell">Profit</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.orders.map((order) => this.renderOrderRow(order))}
        </tbody>
      </table>
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
        <td class="price-cell">$${order.totalAmount.toFixed(2)}</td>
        <td class="price-cell">${order.totalCostBasis != null ? `$${order.totalCostBasis.toFixed(2)}` : '—'}</td>
        <td
          class="price-cell"
          style="${order.totalProfit != null && order.totalProfit > 0
            ? 'color: var(--wa-color-success-text);'
            : order.totalProfit != null && order.totalProfit < 0
              ? 'color: var(--wa-color-danger-text);'
              : ''}"
        >
          ${order.totalProfit != null ? `$${order.totalProfit.toFixed(2)}` : '—'}
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
        <td>
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
                        <th>Product</th>
                        <th>Condition</th>
                        <th class="price-cell">Unit Price</th>
                        <th class="price-cell">Cost Basis</th>
                        <th class="price-cell">Qty</th>
                        <th class="price-cell">Subtotal</th>
                        <th class="price-cell">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${order.items.map(
                        (item) => html`
                          <tr>
                            <td>${item.productName}</td>
                            <td>${item.condition}</td>
                            <td class="price-cell">$${item.unitPrice.toFixed(2)}</td>
                            <td class="price-cell">
                              ${item.costBasis != null ? `$${item.costBasis.toFixed(2)}` : '—'}
                            </td>
                            <td class="price-cell">${item.quantity}</td>
                            <td class="price-cell">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
                            <td
                              class="price-cell"
                              style="${item.profit != null && item.profit > 0
                                ? 'color: var(--wa-color-success-text);'
                                : item.profit != null && item.profit < 0
                                  ? 'color: var(--wa-color-danger-text);'
                                  : ''}"
                            >
                              ${item.profit != null ? `$${item.profit.toFixed(2)}` : '—'}
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
    return html`
      <wa-dialog label="Cancel Order" ?open="${this.showCancelDialog}" @wa-after-hide="${this.closeCancelDialog}">
        ${order
          ? html`
              <p>Are you sure you want to cancel order <strong>${order.orderNumber}</strong>?</p>
              <p style="color: var(--wa-color-text-muted); font-size: var(--wa-font-size-s);">
                This will return ${order.items.reduce((sum, i) => sum + i.quantity, 0)}
                item${order.items.reduce((sum, i) => sum + i.quantity, 0) !== 1 ? 's' : ''} back to inventory and mark
                the order as cancelled. This action cannot be undone.
              </p>
            `
          : nothing}
        <wa-button slot="footer" variant="neutral" @click="${this.closeCancelDialog}">Keep Order</wa-button>
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
    if (this.totalPages <= 1) return nothing;

    return html`
      <div class="pagination">
        <span
          >Showing ${(this.page - 1) * this.pageSize + 1}–${Math.min(this.page * this.pageSize, this.totalCount)} of
          ${this.totalCount} orders</span
        >
        <div class="pagination-controls">
          <wa-button
            size="small"
            appearance="outlined"
            ?disabled="${this.page <= 1}"
            @click="${() => this.goToPage(this.page - 1)}"
          >
            <wa-icon name="chevron-left"></wa-icon>
          </wa-button>
          <span>Page ${this.page} of ${this.totalPages}</span>
          <wa-button
            size="small"
            appearance="outlined"
            ?disabled="${this.page >= this.totalPages}"
            @click="${() => this.goToPage(this.page + 1)}"
          >
            <wa-icon name="chevron-right"></wa-icon>
          </wa-button>
        </div>
      </div>
    `;
  }
}
