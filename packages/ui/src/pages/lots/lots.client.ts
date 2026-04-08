import { LitElement, css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '../../components/ogs-page.ts';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { TypedDocumentString } from '../../graphql/graphql';

// ---------------------------------------------------------------------------
// GraphQL Operations
// ---------------------------------------------------------------------------

const GetLotsQuery = new TypedDocumentString(`
  query GetLots($filters: LotFilters, $pagination: PaginationInput) {
    getLots(filters: $filters, pagination: $pagination) {
      lots {
        id
        name
        description
        amountPaid
        acquisitionDate
        totalMarketValue
        totalCost
        projectedProfitLoss
        projectedProfitMargin
        createdAt
        items { id }
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`) as unknown as TypedDocumentString<
  {
    getLots: {
      lots: Array<{
        id: number;
        name: string;
        description: string | null;
        amountPaid: number;
        acquisitionDate: string;
        totalMarketValue: number;
        totalCost: number;
        projectedProfitLoss: number;
        projectedProfitMargin: number;
        createdAt: string;
        items: Array<{ id: number }>;
      }>;
      totalCount: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  },
  { filters?: { searchTerm?: string } | null; pagination?: { page?: number; pageSize?: number } | null }
>;

const DeleteLotMutation = new TypedDocumentString(`
  mutation DeleteLot($id: Int!) {
    deleteLot(id: $id)
  }
`) as unknown as TypedDocumentString<{ deleteLot: boolean }, { id: number }>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LotSummary {
  id: number;
  name: string;
  description: string | null;
  amountPaid: number;
  acquisitionDate: string;
  totalMarketValue: number;
  totalCost: number;
  projectedProfitLoss: number;
  projectedProfitMargin: number;
  createdAt: string;
  itemCount: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('ogs-lots-page')
export class OgsLotsPage extends LitElement {
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';
  @property({ type: Boolean }) canManageInventory = false;
  @property({ type: Boolean }) canManageLots = false;
  @property({ type: Boolean }) canViewDashboard = false;
  @property({ type: Boolean }) canAccessSettings = false;
  @property({ type: Boolean }) canManageStoreLocations = false;
  @property({ type: Boolean }) canManageUsers = false;
  @property({ type: Boolean }) canViewTransactionLog = false;
  @property({ type: String }) activeOrganizationId = '';
  @property({ type: Boolean }) showStoreSelector = false;

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
      }
      .page-header p {
        margin: 0.25rem 0 0 0;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      .action-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .action-bar .search-spacer {
        flex: 1;
      }

      .filter-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .filter-bar wa-input {
        flex: 1;
        max-width: 400px;
      }

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

      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        text-align: left;
        padding: 0.5rem 0.75rem;
        font-size: var(--wa-font-size-s);
        font-weight: 600;
        color: var(--wa-color-text-muted);
        border-bottom: 2px solid var(--wa-color-surface-border);
        white-space: nowrap;
      }
      td {
        padding: 0.625rem 0.75rem;
        vertical-align: middle;
        font-size: var(--wa-font-size-s);
      }
      tr:not(:last-child) td {
        border-bottom: 1px solid var(--wa-color-surface-border);
      }
      tr.clickable-row {
        cursor: pointer;
      }
      tr.clickable-row:hover td {
        background: var(--wa-color-surface-alt);
      }

      .profit-positive {
        color: var(--wa-color-success-text);
      }
      .profit-negative {
        color: var(--wa-color-danger-text);
      }

      .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--wa-color-text-muted);
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .pagination span {
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
      }

      .actions-cell {
        display: flex;
        gap: 0.25rem;
      }
    `,
  ];

  @state() lots: LotSummary[] = [];
  @state() loading = true;
  @state() searchTerm = '';
  @state() currentPage = 1;
  @state() totalPages = 1;
  @state() totalCount = 0;
  @state() deleteConfirmLotId: number | null = null;
  @state() deleting = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.fetchLots();
  }

  private async fetchLots() {
    this.loading = true;
    try {
      const result = await execute(GetLotsQuery, {
        filters: this.searchTerm ? { searchTerm: this.searchTerm } : null,
        pagination: { page: this.currentPage, pageSize: 25 },
      });
      if (result?.data?.getLots) {
        const data = result.data.getLots;
        this.lots = data.lots.map((l) => ({ ...l, itemCount: l.items.length }));
        this.totalPages = data.totalPages;
        this.totalCount = data.totalCount;
        this.currentPage = data.page;
      }
    } catch {
      // ignore
    } finally {
      this.loading = false;
    }
  }

  private handleSearch(e: Event) {
    this.searchTerm = (e.target as HTMLInputElement).value;
    this.currentPage = 1;
    this.fetchLots();
  }

  private async handleDelete() {
    if (!this.deleteConfirmLotId) return;
    this.deleting = true;
    try {
      await execute(DeleteLotMutation, { id: this.deleteConfirmLotId });
      this.deleteConfirmLotId = null;
      this.fetchLots();
    } catch {
      // ignore
    } finally {
      this.deleting = false;
    }
  }

  private formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  render() {
    return html`
      <ogs-page
        activePage="lots"
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
        @store-changed="${() => this.fetchLots()}"
      >
        <div class="page-header">
          <div class="page-header-icon">
            <wa-icon name="layer-group" style="font-size: 1.5rem;"></wa-icon>
          </div>
          <div class="page-header-content">
            <h2>Lots</h2>
            <p>Manage card lots and batch inventory purchases</p>
          </div>
        </div>

        <div class="action-bar">
          <wa-button variant="brand" href="/lots/new">
            <wa-icon slot="start" name="plus"></wa-icon>
            Add Lot
          </wa-button>
          <div class="search-spacer"></div>
        </div>

        <div class="filter-bar">
          <wa-input placeholder="Search lots..." .value="${this.searchTerm}" @input="${this.handleSearch}">
            <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
          </wa-input>
        </div>

        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading lots...</span>
            </div>
          `,
          () => this.renderLotsTable(),
        )}
        ${this.renderDeleteDialog()}
      </ogs-page>
    `;
  }

  private renderLotsTable() {
    if (this.lots.length === 0) {
      return html`
        <div class="empty-state">
          <wa-icon name="layer-group" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></wa-icon>
          <p>No lots found. Click "Add Lot" to create your first lot.</p>
        </div>
      `;
    }

    return html`
      <wa-card appearance="outline">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Items</th>
              <th>Amount Paid</th>
              <th>Market Value</th>
              <th>Profit/Loss</th>
              <th>Margin</th>
              <th>Date</th>
              <th style="width: 100px;"></th>
            </tr>
          </thead>
          <tbody>
            ${this.lots.map(
              (lot) => html`
                <tr class="clickable-row" @click="${() => (window.location.href = `/lots/${lot.id}`)}">
                  <td><strong>${lot.name}</strong></td>
                  <td>${lot.itemCount}</td>
                  <td>${this.formatCurrency(lot.amountPaid)}</td>
                  <td>${this.formatCurrency(lot.totalMarketValue)}</td>
                  <td class="${lot.projectedProfitLoss >= 0 ? 'profit-positive' : 'profit-negative'}">
                    ${this.formatCurrency(lot.projectedProfitLoss)}
                  </td>
                  <td class="${lot.projectedProfitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">
                    ${lot.projectedProfitMargin.toFixed(1)}%
                  </td>
                  <td>${lot.acquisitionDate}</td>
                  <td>
                    <div class="actions-cell" @click="${(e: Event) => e.stopPropagation()}">
                      <wa-button variant="text" size="small" href="/lots/${lot.id}">
                        <wa-icon name="pen-to-square"></wa-icon>
                      </wa-button>
                      <wa-button
                        variant="text"
                        size="small"
                        @click="${() => {
                          this.deleteConfirmLotId = lot.id;
                        }}"
                      >
                        <wa-icon name="trash"></wa-icon>
                      </wa-button>
                    </div>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </wa-card>

      ${this.totalPages > 1
        ? html`
            <div class="pagination">
              <wa-button
                variant="text"
                size="small"
                ?disabled="${this.currentPage <= 1}"
                @click="${() => {
                  this.currentPage--;
                  this.fetchLots();
                }}"
                >Previous</wa-button
              >
              <span>Page ${this.currentPage} of ${this.totalPages} (${this.totalCount} lots)</span>
              <wa-button
                variant="text"
                size="small"
                ?disabled="${this.currentPage >= this.totalPages}"
                @click="${() => {
                  this.currentPage++;
                  this.fetchLots();
                }}"
                >Next</wa-button
              >
            </div>
          `
        : nothing}
    `;
  }

  private renderDeleteDialog() {
    return html`
      <wa-dialog
        ?open="${this.deleteConfirmLotId != null}"
        label="Delete Lot"
        @wa-after-hide="${() => {
          this.deleteConfirmLotId = null;
        }}"
      >
        <p>Are you sure you want to delete this lot? This will also remove the associated inventory stock entries.</p>
        <div slot="footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
          <wa-button
            variant="neutral"
            @click="${() => {
              this.deleteConfirmLotId = null;
            }}"
            >Cancel</wa-button
          >
          <wa-button variant="danger" ?loading="${this.deleting}" @click="${this.handleDelete}">Delete</wa-button>
        </div>
      </wa-dialog>
    `;
  }
}
