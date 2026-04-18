import { LitElement, type PropertyValues, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';

export interface GameOption {
  categoryId: number;
  name: string;
  displayName: string;
}

/**
 * A reusable games picker component with search, select/deselect all,
 * and a scrollable checkbox grid.
 *
 * @fires ogs-games-change - Fired when the selected games change. Detail: `{ categoryIds: number[] }`
 * @slot empty - Optional custom content to show when no games are available. Defaults to a plain text message.
 */
@customElement('ogs-games-picker')
export class OgsGamesPicker extends LitElement {
  /** All available games to choose from. */
  @property({ type: Array }) games: GameOption[] = [];

  /** Currently selected category IDs. */
  @property({ type: Array }) selectedCategoryIds: number[] = [];

  static styles = css`
    :host {
      display: block;
    }

    /* --- Toolbar --- */

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--wa-space-s);
      margin-bottom: var(--wa-space-s);
      flex-wrap: wrap;
    }

    .toolbar wa-input {
      flex: 1;
      min-width: 180px;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: var(--wa-space-2xs);
      flex-shrink: 0;
    }

    .games-count {
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-text-muted);
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* --- Grid --- */

    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--wa-space-2xs) var(--wa-space-m);
      max-height: 320px;
      overflow-y: auto;
      padding: var(--wa-space-s);
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-m);
      background: var(--wa-color-surface-raised);
    }

    .games-grid wa-checkbox {
      padding: var(--wa-space-2xs) 0;
      overflow: hidden;
      min-width: 0;
    }

    .games-grid wa-checkbox::part(base) {
      overflow: hidden;
    }

    .games-grid wa-checkbox::part(label) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .games-empty {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--wa-space-l);
      color: var(--wa-color-text-muted);
      font-size: var(--wa-font-size-s);
    }

    .no-games {
      color: var(--wa-color-text-muted);
      font-size: var(--wa-font-size-s);
    }
  `;

  @state() private searchTerm = '';

  // Derived state recalculated in willUpdate
  private cachedFiltered: GameOption[] = [];
  private cachedSelectedSet = new Set<number>();
  private cachedAllFilteredSelected = false;
  private cachedAnyFilteredSelected = false;

  protected override willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);

    const filtered = this.searchTerm
      ? this.games.filter((g) => g.displayName.toLowerCase().includes(this.searchTerm.toLowerCase()))
      : this.games;

    const selectedSet = new Set(this.selectedCategoryIds);
    const allSelected = filtered.length > 0 && filtered.every((g) => selectedSet.has(g.categoryId));
    const anySelected = filtered.some((g) => selectedSet.has(g.categoryId));

    this.cachedFiltered = filtered;
    this.cachedSelectedSet = selectedSet;
    this.cachedAllFilteredSelected = allSelected;
    this.cachedAnyFilteredSelected = anySelected;
  }

  private emitChange(categoryIds: number[]) {
    this.dispatchEvent(
      new CustomEvent('ogs-games-change', {
        detail: { categoryIds },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleToggle(categoryId: number, checked: boolean) {
    const next = checked
      ? [...this.selectedCategoryIds, categoryId]
      : this.selectedCategoryIds.filter((id) => id !== categoryId);
    this.emitChange(next);
  }

  private handleSelectAll() {
    const filteredIds = this.cachedFiltered.map((g) => g.categoryId);
    const merged = new Set([...this.selectedCategoryIds, ...filteredIds]);
    this.emitChange([...merged]);
  }

  private handleDeselectAll() {
    const filteredIds = new Set(this.cachedFiltered.map((g) => g.categoryId));
    this.emitChange(this.selectedCategoryIds.filter((id) => !filteredIds.has(id)));
  }

  render() {
    if (this.games.length === 0) {
      return html`<slot name="empty">
        <p class="no-games">No game categories available. Please populate your TCG data catalog first.</p>
      </slot>`;
    }

    return html`
      <div class="toolbar">
        <wa-input
          placeholder="Search games..."
          .value="${this.searchTerm}"
          @input="${(e: Event) => {
            this.searchTerm = (e.target as HTMLInputElement).value;
          }}"
          clearable
        >
          <wa-icon slot="prefix" name="magnifying-glass"></wa-icon>
        </wa-input>
        <div class="toolbar-actions">
          <wa-button
            size="small"
            variant="default"
            @click="${this.handleSelectAll}"
            ?disabled="${this.cachedAllFilteredSelected}"
          >
            Select all
          </wa-button>
          <wa-button
            size="small"
            variant="default"
            @click="${this.handleDeselectAll}"
            ?disabled="${!this.cachedAnyFilteredSelected}"
          >
            Deselect all
          </wa-button>
        </div>
        <span class="games-count">${this.selectedCategoryIds.length} of ${this.games.length} selected</span>
      </div>
      <div class="games-grid">
        ${this.cachedFiltered.length === 0
          ? html`<div class="games-empty">No games match your search</div>`
          : this.cachedFiltered.map(
              (game) => html`
                <wa-checkbox
                  ?checked="${this.cachedSelectedSet.has(game.categoryId)}"
                  @change="${(e: Event) => {
                    this.handleToggle(game.categoryId, (e.target as HTMLInputElement).checked);
                  }}"
                >
                  ${game.displayName}
                </wa-checkbox>
              `,
            )}
      </div>
    `;
  }
}
