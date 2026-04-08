import { css, html, LitElement, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/button-group/button-group.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import '../../components/ogs-page.ts';
import '../../components/ogs-chart.ts';
import { execute } from '../../lib/graphql.ts';
import { TypedDocumentString } from '../../graphql/graphql.ts';
import { activeStoreId } from '../../lib/store-context.ts';
import type { ChartData } from 'chart.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DatePreset = 'today' | 'week' | 'month' | 'year';

interface SalesDataPoint {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  orderCount: number;
}

interface SalesSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  orderCount: number;
}

interface SalesBreakdown {
  summary: SalesSummary;
  dataPoints: SalesDataPoint[];
  granularity: string;
}

interface BestSeller {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface InventorySummary {
  totalSkus: number;
  totalUnits: number;
  totalCostValue: number;
  totalRetailValue: number;
}

interface OrderStatusBreakdown {
  open: number;
  completed: number;
  cancelled: number;
  total: number;
}

// ---------------------------------------------------------------------------
// GraphQL Queries
// ---------------------------------------------------------------------------

const GetDashboardSalesQuery = new TypedDocumentString(`
  query GetDashboardSales($organizationId: String!, $dateRange: DashboardDateRange!) {
    getDashboardSales(organizationId: $organizationId, dateRange: $dateRange) {
      summary {
        totalRevenue
        totalCost
        totalProfit
        profitMargin
        orderCount
      }
      dataPoints {
        label
        revenue
        cost
        profit
        orderCount
      }
      granularity
    }
  }
`) as unknown as TypedDocumentString<
  { getDashboardSales: SalesBreakdown },
  { organizationId: string; dateRange: { startDate: string; endDate: string } }
>;

const GetDashboardBestSellersQuery = new TypedDocumentString(`
  query GetDashboardBestSellers($organizationId: String!, $dateRange: DashboardDateRange!, $sortBy: String!, $limit: Int) {
    getDashboardBestSellers(organizationId: $organizationId, dateRange: $dateRange, sortBy: $sortBy, limit: $limit) {
      productId
      productName
      totalQuantity
      totalRevenue
    }
  }
`) as unknown as TypedDocumentString<
  { getDashboardBestSellers: BestSeller[] },
  { organizationId: string; dateRange: { startDate: string; endDate: string }; sortBy: string; limit?: number }
>;

const GetDashboardInventorySummaryQuery = new TypedDocumentString(`
  query GetDashboardInventorySummary($organizationId: String!) {
    getDashboardInventorySummary(organizationId: $organizationId) {
      totalSkus
      totalUnits
      totalCostValue
      totalRetailValue
    }
  }
`) as unknown as TypedDocumentString<{ getDashboardInventorySummary: InventorySummary }, { organizationId: string }>;

const GetDashboardOrderStatusQuery = new TypedDocumentString(`
  query GetDashboardOrderStatus($organizationId: String!, $dateRange: DashboardDateRange!) {
    getDashboardOrderStatus(organizationId: $organizationId, dateRange: $dateRange) {
      open
      completed
      cancelled
      total
    }
  }
`) as unknown as TypedDocumentString<
  { getDashboardOrderStatus: OrderStatusBreakdown },
  { organizationId: string; dateRange: { startDate: string; endDate: string } }
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeDateRange(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();
  let start: Date;

  switch (preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayOfWeek = start.getDay();
      const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = start
      start.setDate(start.getDate() - daysBack);
      break;
    }
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
  }

  return { startDate: start.toISOString(), endDate };
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '--';
  return new Intl.NumberFormat('en-US').format(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('ogs-home-page')
export class HomePage extends LitElement {
  // --- Server-injected properties ---
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

  // --- UI state ---
  @state() private datePreset: DatePreset = 'month';
  @state() private bestSellerSort: 'quantity' | 'revenue' = 'quantity';

  // --- Data state ---
  @state() private salesData: SalesBreakdown | null = null;
  @state() private bestSellers: BestSeller[] = [];
  @state() private inventorySummary: InventorySummary | null = null;
  @state() private orderStatus: OrderStatusBreakdown | null = null;
  // --- Loading/error state ---
  @state() private initialLoad = true;
  @state() private salesLoading = true;
  @state() private bestSellersLoading = true;
  @state() private inventoryLoading = true;
  @state() private orderStatusLoading = true;
  @state() private error = '';

  // --- Internal ---
  private _refreshInterval?: ReturnType<typeof setInterval>;
  private _fetching = false;

  // =========================================================================
  // Lifecycle
  // =========================================================================

  override connectedCallback() {
    super.connectedCallback();
    this._fetchAllData();
    this._refreshInterval = setInterval(() => this._silentRefresh(), 60_000);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = undefined;
    }
  }

  // =========================================================================
  // Data Fetching
  // =========================================================================

  private _getOrganizationId(): string {
    return activeStoreId.get() || this.activeOrganizationId || '';
  }

  private async _fetchAllData() {
    const orgId = this._getOrganizationId();
    if (!orgId) {
      this.salesLoading = false;
      this.bestSellersLoading = false;
      this.inventoryLoading = false;
      this.orderStatusLoading = false;
      this.initialLoad = false;
      return;
    }

    this._fetching = true;
    const dateRange = computeDateRange(this.datePreset);

    try {
      const [salesResult, bestSellersResult, inventoryResult, orderStatusResult] = await Promise.all([
        execute(GetDashboardSalesQuery, { organizationId: orgId, dateRange }),
        execute(GetDashboardBestSellersQuery, {
          organizationId: orgId,
          dateRange,
          sortBy: this.bestSellerSort,
          limit: 10,
        }),
        execute(GetDashboardInventorySummaryQuery, { organizationId: orgId }),
        execute(GetDashboardOrderStatusQuery, { organizationId: orgId, dateRange }),
      ]);

      if (salesResult.data) {
        this.salesData = salesResult.data.getDashboardSales;
      }
      if (bestSellersResult.data) {
        this.bestSellers = bestSellersResult.data.getDashboardBestSellers;
      }
      if (inventoryResult.data) {
        this.inventorySummary = inventoryResult.data.getDashboardInventorySummary;
      }
      if (orderStatusResult.data) {
        this.orderStatus = orderStatusResult.data.getDashboardOrderStatus;
      }

      this.error = '';
    } catch (err) {
      if (this.initialLoad) {
        this.error = err instanceof Error ? err.message : 'Failed to load dashboard data';
      }
    } finally {
      this.salesLoading = false;
      this.bestSellersLoading = false;
      this.inventoryLoading = false;
      this.orderStatusLoading = false;
      this.initialLoad = false;
      this._fetching = false;
    }
  }

  private async _fetchDateDependentData() {
    const orgId = this._getOrganizationId();
    if (!orgId) return;

    this.salesLoading = true;
    this.bestSellersLoading = true;
    this.orderStatusLoading = true;
    const dateRange = computeDateRange(this.datePreset);

    try {
      const [salesResult, bestSellersResult, orderStatusResult] = await Promise.all([
        execute(GetDashboardSalesQuery, { organizationId: orgId, dateRange }),
        execute(GetDashboardBestSellersQuery, {
          organizationId: orgId,
          dateRange,
          sortBy: this.bestSellerSort,
          limit: 10,
        }),
        execute(GetDashboardOrderStatusQuery, { organizationId: orgId, dateRange }),
      ]);

      if (salesResult.data) this.salesData = salesResult.data.getDashboardSales;
      if (bestSellersResult.data) this.bestSellers = bestSellersResult.data.getDashboardBestSellers;
      if (orderStatusResult.data) this.orderStatus = orderStatusResult.data.getDashboardOrderStatus;
    } catch {
      // Silent failure on filter change
    } finally {
      this.salesLoading = false;
      this.bestSellersLoading = false;
      this.orderStatusLoading = false;
    }
  }

  private async _fetchBestSellers() {
    const orgId = this._getOrganizationId();
    if (!orgId) return;

    this.bestSellersLoading = true;
    const dateRange = computeDateRange(this.datePreset);

    try {
      const result = await execute(GetDashboardBestSellersQuery, {
        organizationId: orgId,
        dateRange,
        sortBy: this.bestSellerSort,
        limit: 10,
      });
      if (result.data) this.bestSellers = result.data.getDashboardBestSellers;
    } catch {
      // Silent
    } finally {
      this.bestSellersLoading = false;
    }
  }

  private _silentRefresh() {
    if (this._fetching) return; // Skip if already fetching
    this._fetchAllDataSilently();
  }

  private async _fetchAllDataSilently() {
    const orgId = this._getOrganizationId();
    if (!orgId) return;

    this._fetching = true;
    const dateRange = computeDateRange(this.datePreset);

    try {
      const [salesResult, bestSellersResult, inventoryResult, orderStatusResult] = await Promise.all([
        execute(GetDashboardSalesQuery, { organizationId: orgId, dateRange }),
        execute(GetDashboardBestSellersQuery, {
          organizationId: orgId,
          dateRange,
          sortBy: this.bestSellerSort,
          limit: 10,
        }),
        execute(GetDashboardInventorySummaryQuery, { organizationId: orgId }),
        execute(GetDashboardOrderStatusQuery, { organizationId: orgId, dateRange }),
      ]);

      if (salesResult.data) this.salesData = salesResult.data.getDashboardSales;
      if (bestSellersResult.data) this.bestSellers = bestSellersResult.data.getDashboardBestSellers;
      if (inventoryResult.data) this.inventorySummary = inventoryResult.data.getDashboardInventorySummary;
      if (orderStatusResult.data) this.orderStatus = orderStatusResult.data.getDashboardOrderStatus;
    } catch {
      // Silent refresh — don't show errors
    } finally {
      this._fetching = false;
    }
  }

  // =========================================================================
  // Event Handlers
  // =========================================================================

  private _handleStoreChanged() {
    this.salesLoading = true;
    this.bestSellersLoading = true;
    this.inventoryLoading = true;
    this.orderStatusLoading = true;
    this._fetchAllData();
  }

  private _handleDatePresetChange(preset: DatePreset) {
    if (this.datePreset === preset) return;
    this.datePreset = preset;
    this._fetchDateDependentData();
  }

  private _handleBestSellerSortChange(sortBy: 'quantity' | 'revenue') {
    if (this.bestSellerSort === sortBy) return;
    this.bestSellerSort = sortBy;
    this._fetchBestSellers();
  }

  // =========================================================================
  // Chart Data
  // =========================================================================

  private _getSalesChartData(): ChartData | null {
    if (!this.salesData?.dataPoints?.length) return null;

    return {
      labels: this.salesData.dataPoints.map((dp) => dp.label),
      datasets: [
        {
          label: 'Revenue',
          data: this.salesData.dataPoints.map((dp) => dp.revenue),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 3,
        },
        {
          label: 'Cost',
          data: this.salesData.dataPoints.map((dp) => dp.cost),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    };
  }

  // =========================================================================
  // Render
  // =========================================================================

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
        color: var(--wa-color-text-quiet);
        font-size: var(--wa-font-size-s);
      }

      /* --- Controls Bar --- */
      .controls-bar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        margin-bottom: var(--wa-space-l);
        gap: var(--wa-space-m);
        box-sizing: border-box;
      }

      /* --- Dashboard Grid --- */
      .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--wa-space-l);
      }

      .dashboard-grid .full-width {
        grid-column: 1 / -1;
      }

      @media (max-width: 768px) {
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }

      /* --- Card Styles --- */
      wa-card {
        --padding: var(--wa-space-l);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--wa-space-m);
        box-sizing: border-box;
      }

      .card-header h3 {
        margin: 0;
        font-size: var(--wa-font-size-l);
        font-weight: 600;
      }

      .card-header wa-button-group {
        line-height: 0;
      }

      /* --- Stats Row --- */
      .stats-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--wa-space-m);
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: var(--wa-space-s);
        padding: var(--wa-space-m);
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
      }

      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: var(--wa-border-radius-m);
        flex-shrink: 0;
      }

      .stat-icon.success {
        background: var(--wa-color-success-fill-quiet);
        color: var(--wa-color-success-text);
      }

      .stat-icon.danger {
        background: var(--wa-color-danger-fill-quiet);
        color: var(--wa-color-danger-text);
      }

      .stat-icon.brand {
        background: var(--wa-color-brand-fill-quiet);
        color: var(--wa-color-brand-text);
      }

      .stat-icon.neutral {
        background: var(--wa-color-neutral-fill-quiet);
        color: var(--wa-color-neutral-text);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .stat-label {
        font-size: var(--wa-font-size-2xs);
        color: var(--wa-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-value {
        font-size: var(--wa-font-size-l);
        font-weight: 700;
      }

      /* --- Chart Container --- */
      .chart-wrapper {
        margin-top: var(--wa-space-l);
      }

      .chart-container {
        height: 280px;
        position: relative;
      }

      .granularity-label {
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
        margin-bottom: var(--wa-space-s);
        text-transform: capitalize;
      }

      /* --- Best Sellers List --- */
      .best-sellers-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .best-seller-item {
        display: flex;
        align-items: center;
        gap: var(--wa-space-m);
        padding: var(--wa-space-s) 0;
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .best-seller-item:last-child {
        border-bottom: none;
      }

      .best-seller-rank {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-neutral-fill-quiet);
        color: var(--wa-color-neutral-text);
        font-size: var(--wa-font-size-xs);
        font-weight: 700;
        flex-shrink: 0;
      }

      .best-seller-rank.top-3 {
        background: var(--wa-color-brand-fill-quiet);
        color: var(--wa-color-brand-text);
      }

      .best-seller-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--wa-font-size-s);
      }

      .best-seller-stats {
        display: flex;
        gap: var(--wa-space-l);
        flex-shrink: 0;
        font-size: var(--wa-font-size-s);
      }

      .best-seller-stat {
        text-align: right;
        min-width: 70px;
      }

      .best-seller-stat.active {
        font-weight: 700;
      }

      /* --- Empty State --- */
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--wa-space-2xl) var(--wa-space-l);
        text-align: center;
        gap: var(--wa-space-s);
      }

      .empty-state wa-icon {
        font-size: 2.5rem;
        color: var(--wa-color-text-muted);
        opacity: 0.5;
      }

      .empty-state-title {
        font-size: var(--wa-font-size-m);
        font-weight: 600;
        color: var(--wa-color-text-default);
        margin: 0;
      }

      .empty-state-description {
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
        margin: 0;
        max-width: 320px;
        line-height: 1.5;
      }

      /* --- Loading --- */
      .card-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--wa-space-2xl);
      }
    `,
  ];

  render() {
    return html`
      <ogs-page
        activePage="Dashboard"
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
        @store-changed="${this._handleStoreChanged}"
      >
        <div class="page-header">
          <div class="page-header-icon">
            <wa-icon name="house" style="font-size: 1.5rem;"></wa-icon>
          </div>
          <div class="page-header-content">
            <h2>Dashboard</h2>
            <p>Store overview and key metrics</p>
          </div>
        </div>

        ${this.error
          ? html`
              <wa-callout variant="danger" style="margin-bottom: var(--wa-space-l);">
                <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                ${this.error}
              </wa-callout>
            `
          : nothing}

        <div class="controls-bar">
          <wa-button-group label="Date range">
            <wa-button
              size="small"
              variant="${this.datePreset === 'today' ? 'brand' : 'neutral'}"
              appearance="filled"
              @click="${() => this._handleDatePresetChange('today')}"
              >Today</wa-button
            >
            <wa-button
              size="small"
              variant="${this.datePreset === 'week' ? 'brand' : 'neutral'}"
              appearance="filled"
              @click="${() => this._handleDatePresetChange('week')}"
              >This Week</wa-button
            >
            <wa-button
              size="small"
              variant="${this.datePreset === 'month' ? 'brand' : 'neutral'}"
              appearance="filled"
              @click="${() => this._handleDatePresetChange('month')}"
              >This Month</wa-button
            >
            <wa-button
              size="small"
              variant="${this.datePreset === 'year' ? 'brand' : 'neutral'}"
              appearance="filled"
              @click="${() => this._handleDatePresetChange('year')}"
              >This Year</wa-button
            >
          </wa-button-group>
        </div>

        <div class="dashboard-grid">
          ${this._renderOrderStatusCard()} ${this._renderSalesCard()} ${this._renderBestSellersCard()}
          ${this._renderInventorySummaryCard()}
        </div>
      </ogs-page>
    `;
  }

  // =========================================================================
  // Card Renderers
  // =========================================================================

  private _renderSalesCard() {
    const chartData = this._getSalesChartData();

    return html`
      <wa-card appearance="filled" class="full-width">
        <div slot="header" class="card-header">
          <h3>Sales</h3>
        </div>
        ${when(
          this.salesLoading && this.initialLoad,
          () => html`<div class="card-loading"><wa-spinner></wa-spinner></div>`,
          () =>
            this.salesData && this.salesData.summary.orderCount > 0
              ? html`
                  <div class="stats-row has-chart">
                    <div class="stat-card">
                      <div class="stat-icon success">
                        <wa-icon name="dollar-sign"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Revenue</span>
                        <span class="stat-value">${formatCurrency(this.salesData.summary.totalRevenue)}</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-icon danger">
                        <wa-icon name="arrow-trend-down"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Costs</span>
                        <span class="stat-value">${formatCurrency(this.salesData.summary.totalCost)}</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-icon brand">
                        <wa-icon name="chart-line"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Profit</span>
                        <span class="stat-value">${formatCurrency(this.salesData.summary.totalProfit)}</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-icon neutral">
                        <wa-icon name="percent"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Margin</span>
                        <span class="stat-value">${this.salesData.summary.profitMargin}%</span>
                      </div>
                    </div>
                  </div>
                  ${chartData
                    ? html`
                        <div class="chart-wrapper">
                          <div class="granularity-label">
                            ${this.salesData.granularity === 'hour'
                              ? 'Hourly'
                              : this.salesData.granularity === 'day'
                                ? 'Daily'
                                : 'Monthly'}
                            Breakdown
                          </div>
                          <div class="chart-container">
                            <ogs-chart type="bar" .data="${chartData}" .options="${{}}"></ogs-chart>
                          </div>
                        </div>
                      `
                    : nothing}
                `
              : html`
                  <div class="empty-state">
                    <wa-icon name="chart-line"></wa-icon>
                    <p class="empty-state-title">No sales data yet</p>
                    <p class="empty-state-description">
                      Sales data will appear here once orders are completed. Try selecting a different date range or
                      check back later.
                    </p>
                  </div>
                `,
        )}
      </wa-card>
    `;
  }

  private _renderBestSellersCard() {
    return html`
      <wa-card appearance="filled">
        <div slot="header" class="card-header">
          <h3>Best Sellers</h3>
          <wa-button-group label="Sort by">
            <wa-button
              size="small"
              variant="${this.bestSellerSort === 'quantity' ? 'brand' : 'neutral'}"
              appearance="filled"
              @click="${() => this._handleBestSellerSortChange('quantity')}"
              >By Quantity</wa-button
            >
            <wa-button
              size="small"
              variant="${this.bestSellerSort === 'revenue' ? 'brand' : 'neutral'}"
              appearance="filled"
              @click="${() => this._handleBestSellerSortChange('revenue')}"
              >By Revenue</wa-button
            >
          </wa-button-group>
        </div>
        ${when(
          this.bestSellersLoading && this.initialLoad,
          () => html`<div class="card-loading"><wa-spinner></wa-spinner></div>`,
          () =>
            this.bestSellers.length > 0
              ? html`
                  <ul class="best-sellers-list">
                    ${this.bestSellers.map(
                      (seller, i) => html`
                        <li class="best-seller-item">
                          <span class="best-seller-rank ${i < 3 ? 'top-3' : ''}">${i + 1}</span>
                          <span class="best-seller-name">${seller.productName}</span>
                          <div class="best-seller-stats">
                            <div class="best-seller-stat ${this.bestSellerSort === 'quantity' ? 'active' : ''}">
                              <div>${formatNumber(seller.totalQuantity)} sold</div>
                            </div>
                            <div class="best-seller-stat ${this.bestSellerSort === 'revenue' ? 'active' : ''}">
                              <div>${formatCurrency(seller.totalRevenue)}</div>
                            </div>
                          </div>
                        </li>
                      `,
                    )}
                  </ul>
                `
              : html`
                  <div class="empty-state">
                    <wa-icon name="trophy"></wa-icon>
                    <p class="empty-state-title">No best sellers yet</p>
                    <p class="empty-state-description">
                      Your top-selling products will appear here once orders are placed.
                    </p>
                  </div>
                `,
        )}
      </wa-card>
    `;
  }

  private _renderOrderStatusCard() {
    return html`
      <wa-card appearance="filled" class="full-width">
        <div slot="header" class="card-header">
          <h3>Order Status</h3>
        </div>
        ${when(
          this.orderStatusLoading && this.initialLoad,
          () => html`<div class="card-loading"><wa-spinner></wa-spinner></div>`,
          () =>
            this.orderStatus && this.orderStatus.total > 0
              ? html`
                  <div class="stats-row">
                    <div class="stat-card">
                      <div class="stat-icon neutral">
                        <wa-icon name="receipt"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Total</span>
                        <span class="stat-value">${formatNumber(this.orderStatus.total)}</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-icon brand">
                        <wa-icon name="clock"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Open</span>
                        <span class="stat-value">${formatNumber(this.orderStatus.open)}</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-icon success">
                        <wa-icon name="circle-check"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Completed</span>
                        <span class="stat-value">${formatNumber(this.orderStatus.completed)}</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-icon danger">
                        <wa-icon name="circle-xmark"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Cancelled</span>
                        <span class="stat-value">${formatNumber(this.orderStatus.cancelled)}</span>
                      </div>
                    </div>
                  </div>
                `
              : html`
                  <div class="empty-state">
                    <wa-icon name="receipt"></wa-icon>
                    <p class="empty-state-title">No orders yet</p>
                    <p class="empty-state-description">
                      Order status breakdown will appear here once customers start placing orders.
                    </p>
                  </div>
                `,
        )}
      </wa-card>
    `;
  }

  private _renderInventorySummaryCard() {
    return html`
      <wa-card appearance="filled">
        <div slot="header" class="card-header">
          <h3>Inventory Summary</h3>
        </div>
        ${when(
          this.inventoryLoading && this.initialLoad,
          () => html`<div class="card-loading"><wa-spinner></wa-spinner></div>`,
          () =>
            this.inventorySummary && (this.inventorySummary.totalSkus > 0 || this.inventorySummary.totalUnits > 0)
              ? html`
                  <div class="stats-row">
                    <div class="stat-card">
                      <div class="stat-icon brand">
                        <wa-icon name="boxes-stacked"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">SKUs</span>
                        <span class="stat-value">${formatNumber(this.inventorySummary.totalSkus)}</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-icon neutral">
                        <wa-icon name="cubes"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Units</span>
                        <span class="stat-value">${formatNumber(this.inventorySummary.totalUnits)}</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-icon danger">
                        <wa-icon name="tags"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Cost Value</span>
                        <span class="stat-value">${formatCurrency(this.inventorySummary.totalCostValue)}</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-icon success">
                        <wa-icon name="money-bill-wave"></wa-icon>
                      </div>
                      <div class="stat-content">
                        <span class="stat-label">Retail Value</span>
                        <span class="stat-value">${formatCurrency(this.inventorySummary.totalRetailValue)}</span>
                      </div>
                    </div>
                  </div>
                `
              : html`
                  <div class="empty-state">
                    <wa-icon name="boxes-stacked"></wa-icon>
                    <p class="empty-state-title">No inventory yet</p>
                    <p class="empty-state-description">
                      Add products to your inventory to see a summary of your stock levels and value here.
                    </p>
                  </div>
                `,
        )}
      </wa-card>
    `;
  }
}
