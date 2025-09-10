import { css, html, LitElement, nothing, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import "@awesome.me/webawesome/dist/components/radio-group/radio-group.js";
import "@awesome.me/webawesome/dist/components/radio/radio.js";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/badge/badge.js";
import "@awesome.me/webawesome/dist/components/spinner/spinner.js";
import "@awesome.me/webawesome/dist/components/tooltip/tooltip.js";
import nativeStyle from "@awesome.me/webawesome/dist/styles/native.css?inline";
import utilityStyles from "@awesome.me/webawesome/dist/styles/utilities.css?inline";
import "../../components/ogs-page.ts";
import { graphql } from "../../graphql/gql.ts";
import { execute } from "../../lib/graphql.ts";
import { Card, Set } from "../../schema/types.generated.ts";
import { ConditionInventory } from "../../graphql/graphql.ts";
import WaSelect from "@awesome.me/webawesome/dist/components/select/select.js";

@customElement("ogs-cards-page")
export class CardsPage extends LitElement {
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

      .inventory-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .header-controls {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .search-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .filter-button {
        flex-shrink: 0;
      }

      .search-input {
        flex-grow: 1;
        max-width: 400px;
      }

      .add-button {
        margin-bottom: 0;
      }

      .table-container {
        overflow-x: auto;
      }

      .card-thumbnail {
        width: 60px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--wa-color-text-secondary);
        font-size: 24px;
      }

      .wa-table th,
      .wa-table td {
        vertical-align: middle;
      }

      .wa-table th.price-header {
        text-align: right;
      }

      .wa-table th.quantity-header {
        text-align: center;
      }

      .price-cell {
        text-align: right;
      }

      .quantity-cell {
        text-align: center;
      }

      .card-name-link {
        color: var(--wa-color-text-link);
        text-decoration: none;
      }

      .card-name-link:hover {
        text-decoration: underline;
      }

      .cart-controls {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        width: 100%;
      }

      .cart-controls {
        align-items: end;
      }

      .add-to-cart {
        margin: 0;
      }

      .finishes {
        margin-left: 0.25rem;
        text-transform: capitalize;
      }
    `,
  ];

  @state()
  private cards: Card[] = [];

  @state()
  private sets: Set[] = [];

  @state()
  private setsLoading = true;

  @property()
  game: string = "";

  @property()
  cardsSearchTerm: string = new URLSearchParams(window.location.search).get("search") ?? "";

  @property()
  setFilter: string | null = new URLSearchParams(window.location.search).get("set");

  private handleSearch(event: Event) {
    const { value } = event.target as HTMLInputElement;
    this.cardsSearchTerm = value.toLowerCase();
    this.updateQueryParam("search", value);
    this.fetchSingleCardInventory();
  }

  private handleSetFilterChange(event: Event) {
    const { value } = event.target as WaSelect;
    const normalizedValue = Array.isArray(value) ? value.join(",") : value;
    this.setFilter = normalizedValue;
    this.updateQueryParam("set", normalizedValue);
    this.fetchSingleCardInventory();
  }

  private updateQueryParam(name: string, value: string | null) {
    const url = new URL(window.location.href);
    if (!value) {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }
    window.history.pushState(null, "", url.toString());
  }

  connectedCallback() {
    super.connectedCallback();
    this.fetchSingleCardInventory();
    this.fetchSets();
  }

  async fetchSets() {
    this.setsLoading = true;
    const GetSetsQuery = graphql(`
      query GetSetsQuery($game: String!, $filters: SetFilters) {
        getSets(game: $game, filters: $filters) {
          code
          name
        }
      }
    `);

    const result = await execute(GetSetsQuery, { game: this.game, filters: {} });

    if (result?.errors?.length) {
      console.log({ result });
    } else {
      this.sets = result.data.getSets;
    }
    this.setsLoading = false;
  }

  async fetchSingleCardInventory() {
    const GetSingleCardInventoryQuery = graphql(`
      query GetSingleCardInventoryQuery($game: String!, $filters: SingleCardFilters) {
        getSingleCardInventory(game: $game, filters: $filters) {
          id
          name
          setName
          finishes
          images {
            small
            large
          }
          inventory {
            NM {
              quantity
              price
            }
            LP {
              quantity
              price
            }
            MP {
              quantity
              price
            }
          }
        }
      }
    `);

    const result = await execute(GetSingleCardInventoryQuery, {
      game: this.game,
      filters: {
        searchTerm: this.cardsSearchTerm,
        setCode: this.setFilter,
      },
    });

    if (result?.errors?.length) {
      console.log({ result });
    } else {
      this.cards = result.data.getSingleCardInventory;
    }
  }

  render() {
    return html`
      <ogs-page activePage="games/${this.game}/cards">
        <div class="inventory-header">
          <h1>Cards</h1>
          <div class="header-controls">
            <div class="add-button">
              <wa-button appearance="filled" href="/inventory/add">
                <wa-icon slot="start" name="plus"></wa-icon>
                Add Inventory
              </wa-button>
            </div>
          </div>
        </div>

        <div class="search-container">
          <div class="filter-button">
            <wa-select
              label="Set"
              .value="${this.setFilter}"
              with-clear
              @change="${this.handleSetFilterChange}"
              ?disabled=${this.setsLoading}
            >
              ${this.setsLoading ? html`<wa-spinner slot="start"></wa-spinner>` : this.renderSetOptions()}
            </wa-select>
          </div>
          <div class="search-input">
            <wa-input
              label="Search"
              .value="${this.cardsSearchTerm}"
              with-clear
              @input="${this.handleSearch}"
              clearable
            >
              <wa-icon slot="start" name="search"></wa-icon>
            </wa-input>
          </div>
        </div>

        <wa-card appearance="filled">
          <div class="table-container">
            <table class="wa-table wa-zebra-rows wa-hover-rows">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Set</th>
                  <th>Availability</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this.cards.map(
                  (card) => html`
                    <tr>
                      <td>
                        ${card.images?.small
                          ? html`<a href="${card.images.large}" target="_blank"
                              ><img src="${card.images.small}" alt="${card.name}" class="card-thumbnail"
                            /></a>`
                          : html`<wa-icon name="id-card" variant="regular" class="card-thumbnail"></wa-icon>`}
                      </td>
                      <td>
                        <a href="/games/${this.game}/cards/${card.id}" class="card-name-link">
                          ${card.name.length > 31 ? card.name.substring(0, 31) + "..." : card.name}
                        </a>
                        <span class="finishes">
                          ${card.finishes?.map(
                            (f) => html`
                              <wa-badge id="uuid-${card.id}-${f}"> ${f.charAt(0).toUpperCase()} </wa-badge>
                              <wa-tooltip for="uuid-${card.id}-${f}"> ${f} </wa-tooltip>
                            `,
                          )}
                        </span>
                      </td>
                      <td>${card.setName.length > 20 ? card.setName.substring(0, 20) + "..." : card.setName}</td>
                      <td>
                        ${Object.entries(card.inventory as unknown as Record<string, ConditionInventory>).map(
                          ([condition, { quantity, price }]) => html`
                            <div>${condition}: ${quantity} × $${price}</div>
                          `,
                        )}
                      </td>
                      <td>
                        <div style="display: flex; justify-content: end;"></div>
                        <div class="cart-controls">
                          <wa-select id=${card.id} label="Condition" style="width: unset; max-width: 120px;">
                            ${Object.keys(card.inventory).map(
                              (condition, index) => html`
                                <wa-option ?selected="${index === 0}" value="${condition}">${condition}</wa-option>
                              `,
                            )}
                          </wa-select>
                          <wa-input
                            label="Quantity"
                            type="number"
                            min="1"
                            max="99"
                            placeholder="Qty"
                            value="1"
                            style="width: 60px;"
                          ></wa-input>
                          <wa-button appearance="filled" class="add-to-cart">
                            <wa-icon name="cart-plus" label="Add to cart"></wa-icon>
                          </wa-button>
                        </div>
                      </td>
                    </tr>
                  `,
                )}
              </tbody>
            </table>
          </div>
        </wa-card>
      </ogs-page>
    `;
  }

  renderSetOptions() {
    return html`
      <wa-option ?selected="${!this.setFilter}" value="">All Sets</wa-option>
      ${this.sets.map(
        (set) => html`
          <wa-option ?selected="${this.setFilter === set.code}" value="${set.code}"> ${set.name} </wa-option>
        `,
      )}
    `;
  }
}
