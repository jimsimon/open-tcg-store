import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/card/card.js';

import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { execute } from '../../lib/graphql';
import { GetSupportedGamesQuery } from '../../lib/shared-queries';
import { graphql } from '../../graphql/index.ts';
import { BuyRateType } from '../../graphql/graphql.ts';
import { centsToInputValue, inputValueToCents } from '../../lib/currency';

// ---------------------------------------------------------------------------
// GraphQL Operations
// ---------------------------------------------------------------------------

const GetBuyRatesQuery = graphql(`
  query GetBuyRates($categoryId: Int!) {
    getBuyRates(categoryId: $categoryId) {
      id
      description
      fixedRateCents
      percentageRate
      type
      rarity
      hidden
      sortOrder
    }
  }
`);

const GetDistinctRaritiesQuery = graphql(`
  query GetDistinctRarities($categoryId: Int!) {
    getDistinctRarities(categoryId: $categoryId)
  }
`);

const SaveBuyRatesMutation = graphql(`
  mutation SaveBuyRates($input: SaveBuyRatesInput!) {
    saveBuyRates(input: $input) {
      id
      description
      fixedRateCents
      percentageRate
      type
      rarity
      hidden
      sortOrder
    }
  }
`);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SupportedGame {
  categoryId: number;
  name: string;
  displayName: string;
}

interface BuyRateRow {
  description: string;
  fixedRateCents: number | null;
  percentageRate: number | null;
  type: string; // 'fixed' or 'percentage'
  rarity: string | null; // set for rarity-default rows
  hidden: boolean; // whether this row is hidden from public view
  isRarityDefault: boolean; // cannot be deleted
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('ogs-settings-buyrates-page')
export class OgsSettingsBuyRatesPage extends OgsPageBase {
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
        font-size: var(--wa-font-size-m);
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
        font-size: var(--wa-font-size-m);
      }

      .rate-table {
        width: 100%;
        border-collapse: collapse;
      }
      .rate-table th {
        text-align: left;
        padding: 0.5rem 0.75rem;
        font-size: var(--wa-font-size-m);
        font-weight: 600;
        color: var(--wa-color-text-muted);
        border-bottom: 2px solid var(--wa-color-surface-border);
      }
      .rate-table td {
        padding: 0.375rem 0.75rem;
        vertical-align: middle;
      }
      .rate-table tr:not(:last-child) td {
        border-bottom: 1px solid var(--wa-color-surface-border);
      }
      .rate-table wa-input {
        --wa-input-height-m: 2.25rem;
      }
      .rate-table wa-select {
        --wa-input-height-m: 2.25rem;
      }
      .rate-actions {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
      }

      .rarity-label {
        font-size: var(--wa-font-size-m);
        font-weight: 500;
        color: var(--wa-color-text-base);
      }
      .rarity-section-label {
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
        padding: 0.75rem 0.75rem 0.25rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .hidden-row {
        opacity: 0.5;
      }

      .tab-content {
        padding: 1rem 0;
      }
      .tab-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--wa-color-surface-border);
      }
    `,
  ];

  @state() supportedGames: SupportedGame[] = [];
  @state() buyRatesByGame: Map<number, BuyRateRow[]> = new Map();
  @state() raritiesByGame: Map<number, string[]> = new Map();
  @state() activeGameId: number | null = null;
  @state() loading = true;
  @state() savingGame: number | null = null;
  @state() successMessage = '';
  @state() errorMessage = '';

  connectedCallback(): void {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    try {
      const result = await execute(GetSupportedGamesQuery);
      if (result?.data?.getSupportedGames) {
        this.supportedGames = result.data.getSupportedGames;

        // Load buy rates and rarities for each game in parallel
        const promises = this.supportedGames.map(async (game) => {
          const [ratesResult, raritiesResult] = await Promise.all([
            execute(GetBuyRatesQuery, { categoryId: game.categoryId }),
            execute(GetDistinctRaritiesQuery, { categoryId: game.categoryId }),
          ]);
          const entries = ratesResult?.data?.getBuyRates ?? [];
          const rarities = raritiesResult?.data?.getDistinctRarities ?? [];
          return { categoryId: game.categoryId, entries, rarities };
        });

        const results = await Promise.all(promises);
        const rateMap = new Map<number, BuyRateRow[]>();
        const rarityMap = new Map<number, string[]>();

        for (const r of results) {
          rarityMap.set(r.categoryId, r.rarities);

          // Build rows: rarity defaults first, then custom
          const existingByRarity = new Map(r.entries.filter((e) => e.rarity).map((e) => [e.rarity!, e]));
          const customEntries = r.entries.filter((e) => !e.rarity);

          const rows: BuyRateRow[] = [];

          // Rarity default rows
          for (const rarity of r.rarities) {
            const existing = existingByRarity.get(rarity);
            rows.push({
              description: rarity,
              fixedRateCents: existing?.fixedRateCents ?? 0,
              percentageRate: existing?.percentageRate ?? null,
              type: existing?.type ?? 'fixed',
              rarity,
              hidden: existing?.hidden ?? false,
              isRarityDefault: true,
            });
          }

          // Custom rows
          for (const entry of customEntries) {
            rows.push({
              description: entry.description,
              fixedRateCents: entry.fixedRateCents as number | null,
              percentageRate: entry.percentageRate as number | null,
              type: entry.type ?? 'fixed',
              rarity: null,
              hidden: entry.hidden ?? false,
              isRarityDefault: false,
            });
          }

          rateMap.set(r.categoryId, rows);
        }

        this.buyRatesByGame = rateMap;
        this.raritiesByGame = rarityMap;

        if (this.supportedGames.length > 0) {
          this.activeGameId = this.supportedGames[0].categoryId;
        }
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to load data';
    } finally {
      this.loading = false;
    }
  }

  private getRows(categoryId: number): BuyRateRow[] {
    return this.buyRatesByGame.get(categoryId) ?? [];
  }

  private setRows(categoryId: number, rows: BuyRateRow[]) {
    const newMap = new Map(this.buyRatesByGame);
    newMap.set(categoryId, rows);
    this.buyRatesByGame = newMap;
  }

  private handleAddRow(categoryId: number) {
    const rows = [
      ...this.getRows(categoryId),
      {
        description: '',
        fixedRateCents: 0,
        percentageRate: null,
        type: 'fixed',
        rarity: null,
        hidden: false,
        isRarityDefault: false,
      },
    ];
    this.setRows(categoryId, rows);
  }

  private handleRemoveRow(categoryId: number, index: number) {
    const rows = this.getRows(categoryId);
    if (rows[index]?.isRarityDefault) return; // Can't remove rarity defaults
    this.setRows(
      categoryId,
      rows.filter((_, i) => i !== index),
    );
  }

  private handleRowDescriptionChange(categoryId: number, index: number, value: string) {
    const rows = [...this.getRows(categoryId)];
    rows[index] = { ...rows[index], description: value };
    this.setRows(categoryId, rows);
  }

  private handleRowRateChange(categoryId: number, index: number, value: string) {
    const rows = [...this.getRows(categoryId)];
    const row = rows[index];
    if (row.type === 'fixed') {
      rows[index] = { ...row, fixedRateCents: inputValueToCents(parseFloat(value) || 0) };
    } else {
      rows[index] = { ...row, percentageRate: parseFloat(value) || 0 };
    }
    this.setRows(categoryId, rows);
  }

  private handleRowTypeChange(categoryId: number, index: number, value: string) {
    const rows = [...this.getRows(categoryId)];
    if (value === 'fixed') {
      rows[index] = { ...rows[index], type: value, fixedRateCents: 0, percentageRate: null };
    } else {
      rows[index] = { ...rows[index], type: value, fixedRateCents: null, percentageRate: 0 };
    }
    this.setRows(categoryId, rows);
  }

  private handleRowHiddenChange(categoryId: number, index: number, hidden: boolean) {
    const rows = [...this.getRows(categoryId)];
    rows[index] = { ...rows[index], hidden };
    this.setRows(categoryId, rows);
  }

  private async handleSaveGame(categoryId: number) {
    this.savingGame = categoryId;
    this.successMessage = '';
    this.errorMessage = '';

    const rows = this.getRows(categoryId);

    // Validate: all visible rarity defaults must have rate > 0
    const missingRarities = rows.filter((r) => {
      if (!r.isRarityDefault || r.hidden) return false;
      if (r.type === 'fixed') return (r.fixedRateCents ?? 0) <= 0;
      return (r.percentageRate ?? 0) <= 0;
    });
    if (missingRarities.length > 0) {
      this.errorMessage = `All visible rarity rates must be greater than 0. Missing: ${missingRarities.map((r) => r.description).join(', ')}`;
      this.savingGame = null;
      return;
    }

    // Filter out empty custom rows
    const validRows = rows.filter((r) => r.isRarityDefault || r.description.trim() !== '');

    try {
      const result = await execute(SaveBuyRatesMutation, {
        input: {
          categoryId,
          entries: validRows.map((r, i) => ({
            description: r.description.trim(),
            fixedRateCents: r.fixedRateCents,
            percentageRate: r.percentageRate,
            type: r.type as BuyRateType,
            rarity: r.rarity || null,
            hidden: r.hidden,
            sortOrder: i,
          })),
        },
      });

      if (result?.errors?.length) {
        this.errorMessage = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else if (result?.data?.saveBuyRates) {
        // Rebuild rows from saved data merged with rarities
        const rarities = this.raritiesByGame.get(categoryId) ?? [];
        const savedEntries = result.data.saveBuyRates;
        const existingByRarity = new Map(savedEntries.filter((e) => e.rarity).map((e) => [e.rarity!, e]));
        const customEntries = savedEntries.filter((e) => !e.rarity);

        const newRows: BuyRateRow[] = [];
        for (const rarity of rarities) {
          const existing = existingByRarity.get(rarity);
          newRows.push({
            description: rarity,
            fixedRateCents: existing?.fixedRateCents ?? 0,
            percentageRate: existing?.percentageRate ?? null,
            type: existing?.type ?? 'fixed',
            rarity,
            hidden: existing?.hidden ?? false,
            isRarityDefault: true,
          });
        }
        for (const entry of customEntries) {
          newRows.push({
            description: entry.description,
            fixedRateCents: entry.fixedRateCents as number | null,
            percentageRate: entry.percentageRate as number | null,
            type: entry.type ?? 'fixed',
            rarity: null,
            hidden: entry.hidden ?? false,
            isRarityDefault: false,
          });
        }
        this.setRows(categoryId, newRows);

        this.successMessage = 'Buy rates saved successfully';
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    } catch (e) {
      this.errorMessage = e instanceof Error ? e.message : 'Failed to save buy rates';
    } finally {
      this.savingGame = null;
    }
  }

  render() {
    return this.renderPage(
      html`
        ${this.renderPageHeader()}
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading buy rates...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
      `,
      { activePage: 'settings/buyrates', showUserMenu: true },
    );
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="hand-holding-dollar" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Buy Rates</h2>
          <p>Configure buy rate tables for each game your store supports</p>
        </div>
      </div>
    `;
  }

  private renderContent() {
    return html`
      ${this.successMessage
        ? html`
            <wa-callout variant="success" style="margin-bottom: 1rem;">
              <wa-icon slot="icon" name="circle-check"></wa-icon>
              ${this.successMessage}
            </wa-callout>
          `
        : nothing}
      ${this.errorMessage
        ? html`
            <wa-callout variant="danger" style="margin-bottom: 1rem;">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.errorMessage}
            </wa-callout>
          `
        : nothing}
      ${this.supportedGames.length === 0
        ? html`
            <wa-callout variant="neutral">
              <wa-icon slot="icon" name="circle-info"></wa-icon>
              No supported games configured. Go to
              <a href="/settings/general">General Settings</a> to select which games your store supports.
            </wa-callout>
          `
        : this.renderGameSelector()}
    `;
  }

  private renderGameSelector() {
    const activeGame = this.supportedGames.find((g) => g.categoryId === this.activeGameId) ?? this.supportedGames[0];

    return html`
      <wa-card appearance="outline">
        <div style="padding: 1rem 1rem 0;">
          <wa-select
            label="Game"
            .value="${String(activeGame.categoryId)}"
            @wa-change="${(e: CustomEvent) => {
              this.activeGameId = parseInt((e.target as HTMLSelectElement).value, 10);
            }}"
          >
            ${this.supportedGames.map(
              (game) => html`<wa-option value="${game.categoryId}">${game.displayName}</wa-option>`,
            )}
          </wa-select>
        </div>
        ${this.renderGamePanel(activeGame)}
      </wa-card>
    `;
  }

  private renderGamePanel(game: SupportedGame) {
    const rows = this.getRows(game.categoryId);
    const isSaving = this.savingGame === game.categoryId;
    const rarityRows = rows.filter((r) => r.isRarityDefault);
    const customRows = rows.filter((r) => !r.isRarityDefault);

    return html`
      <div class="tab-content">
        <table class="rate-table">
          <thead>
            <tr>
              <th style="width: 35%;">Description</th>
              <th style="width: 18%;">Type</th>
              <th style="width: 22%;">Rate</th>
              <th style="width: 10%;">Visible</th>
              <th style="width: 15%;"></th>
            </tr>
          </thead>
          <tbody>
            ${rarityRows.length > 0
              ? html`
                  <tr>
                    <td colspan="5"><div class="rarity-section-label">Rarity Defaults</div></td>
                  </tr>
                  ${rarityRows.map((row) => {
                    const idx = rows.indexOf(row);
                    return this.renderRateRow(game.categoryId, row, idx, true);
                  })}
                `
              : nothing}
            ${customRows.length > 0
              ? html`
                  <tr>
                    <td colspan="5"><div class="rarity-section-label">Custom Entries</div></td>
                  </tr>
                  ${customRows.map((row) => {
                    const idx = rows.indexOf(row);
                    return this.renderRateRow(game.categoryId, row, idx, false);
                  })}
                `
              : nothing}
          </tbody>
        </table>

        <div class="tab-actions">
          <wa-button variant="neutral" size="small" @click="${() => this.handleAddRow(game.categoryId)}">
            <wa-icon slot="start" name="plus"></wa-icon>
            Add Row
          </wa-button>
          <wa-button
            variant="brand"
            size="small"
            ?loading="${isSaving}"
            @click="${() => this.handleSaveGame(game.categoryId)}"
          >
            <wa-icon slot="start" name="floppy-disk"></wa-icon>
            Save Buy Rates
          </wa-button>
        </div>
      </div>
    `;
  }

  private renderRateRow(categoryId: number, row: BuyRateRow, index: number, isRarityDefault: boolean) {
    return html`
      <tr class="${row.hidden ? 'hidden-row' : ''}">
        <td>
          ${isRarityDefault
            ? html`<span class="rarity-label">${row.description}</span>`
            : html`
                <wa-input
                  size="small"
                  placeholder="e.g. Foil Premium"
                  .value="${row.description}"
                  @input="${(e: Event) => {
                    this.handleRowDescriptionChange(categoryId, index, (e.target as HTMLInputElement).value);
                  }}"
                ></wa-input>
              `}
        </td>
        <td>
          <wa-select
            size="small"
            .value="${row.type}"
            @wa-change="${(e: CustomEvent) => {
              this.handleRowTypeChange(categoryId, index, (e.target as HTMLSelectElement).value);
            }}"
          >
            <wa-option value="fixed">Fixed ($)</wa-option>
            <wa-option value="percentage">% of Market</wa-option>
          </wa-select>
        </td>
        <td>
          <wa-input
            size="small"
            type="number"
            step="${row.type === 'percentage' ? '0.001' : '0.01'}"
            min="0"
            placeholder="${row.type === 'percentage' ? '0.000' : '0.00'}"
            .value="${row.type === 'percentage'
              ? String(row.percentageRate ?? 0)
              : String(centsToInputValue(row.fixedRateCents ?? 0))}"
            @input="${(e: Event) => {
              this.handleRowRateChange(categoryId, index, (e.target as HTMLInputElement).value);
            }}"
          >
            <span slot="prefix">${row.type === 'percentage' ? '%' : '$'}</span>
          </wa-input>
        </td>
        <td style="text-align: center;">
          <wa-switch
            size="small"
            ?checked="${!row.hidden}"
            @wa-change="${(e: CustomEvent) => {
              this.handleRowHiddenChange(
                categoryId,
                index,
                !(e.target as HTMLInputElement & { checked: boolean }).checked,
              );
            }}"
          ></wa-switch>
        </td>
        <td>
          <div class="rate-actions">
            ${isRarityDefault
              ? nothing
              : html`
                  <wa-button
                    variant="danger"
                    appearance="plain"
                    size="small"
                    @click="${() => this.handleRemoveRow(categoryId, index)}"
                  >
                    <wa-icon name="trash"></wa-icon>
                  </wa-button>
                `}
          </div>
        </td>
      </tr>
    `;
  }
}
