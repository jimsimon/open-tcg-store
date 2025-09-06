import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/button/button.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/card/card.js";
import nativeStyle from "@awesome.me/webawesome/dist/styles/native.css?inline";
import utilityStyles from "@awesome.me/webawesome/dist/styles/utilities.css?inline";
import "../../components/ogs-page.ts";
import { graphql } from "../../graphql/gql.ts";
import { execute } from "../../lib/graphql.ts";
import { Card } from "../../schema/types.generated.ts";

@customElement("ogs-inventory-page")
export class InventoryPage extends LitElement {
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

      .quantity-input {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .add-to-cart {
        margin: 0;
      }
    `,
  ];

  @state()
  private inventory: Card[] = [];

  @property()
  private searchTerm = "";

  private handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.fetchInventory();
  }

  async connectedCallback() {
    super.connectedCallback();
    this.fetchInventory();
  }

  async fetchInventory() {
    const LoadInventoryQuery = graphql(`
      query GetSingleCardInventoryQuery($searchTerm: String) {
        getSingleCardInventory(searchTerm: $searchTerm) {
          thumbnail
          id
          inventory {
            condition
            quantity
            price
          }
          name
        }
      }
    `);

    const result = await execute(LoadInventoryQuery, {
      searchTerm: this.searchTerm,
    });

    if (result?.errors?.length) {
      console.log({ result });
    } else {
      this.inventory = result.data.getSingleCardInventory;
    }
  }

  render() {
    return html`
      <ogs-page activePage="Inventory">
        <div class="inventory-header">
          <h1>Inventory</h1>
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
            <wa-button appearance="outline">
              <wa-icon slot="start" name="filter"></wa-icon>
              Filters
            </wa-button>
          </div>
          <div class="search-input">
            <wa-input
              placeholder="Search inventory..."
              @input="${this.handleSearch}"
              clearable
            ></wa-input>
          </div>
        </div>

        <wa-card appearance="filled">
          <div class="table-container">
            <table class="wa-table wa-zebra-rows wa-hover-rows">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th class="price-header">Price</th>
                  <th class="quantity-header">Quantity</th>
                  <th>Condition</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this.inventory.flatMap((item) =>
                  item.inventory.map(
                    (condition) => html`
                      <tr>
                        <td>
                          ${item.thumbnail
                            ? html`<img
                                src="${item.thumbnail}"
                                alt="${item.name}"
                                class="card-thumbnail"
                              />`
                            : html`<wa-icon
                                name="id-card"
                                variant="regular"
                                class="card-thumbnail"
                              ></wa-icon>`}
                        </td>
                        <td>
                          <a
                            href="/inventory/${item.id}"
                            class="card-name-link"
                          >
                            ${item.name.length > 31
                              ? item.name.substring(0, 31) + "..."
                              : item.name}
                          </a>
                        </td>
                        <td class="price-cell">$${condition.price}</td>
                        <td class="quantity-cell">${condition.quantity}</td>
                        <td>${condition.condition}</td>
                        <td>
                          <div class="cart-controls">
                            <div class="quantity-input">
                              <wa-input
                                type="number"
                                min="1"
                                max="99"
                                placeholder="Qty"
                                value="1"
                                style="width: 60px;"
                              ></wa-input>
                            </div>
                            <wa-button appearance="filled" class="add-to-cart">
                              <wa-icon name="cart-plus"></wa-icon>
                            </wa-button>
                          </div>
                        </td>
                      </tr>
                    `,
                  ),
                )}
              </tbody>
            </table>
          </div>
        </wa-card>
      </ogs-page>
    `;
  }
}
