import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import '@awesome.me/webawesome/dist/components/button/button.js'
import '@awesome.me/webawesome/dist/components/input/input.js'
import '@awesome.me/webawesome/dist/components/card/card.js'
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline'
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline'
import "../../components/ogs-page.ts";

// Mock inventory data
const mockInventory = [
  {
    cardId: 'AB12CD34',
    name: 'Dragonfire Mage',
    thumbnail: null,
    conditions: [
      { condition: 'Near Mint', quantity: 10, price: 24.99 },
      { condition: 'Lightly Played', quantity: 3, price: 19.99 },
      { condition: 'Moderately Played', quantity: 2, price: 14.99 },
      { condition: 'Heavily Played', quantity: 0, price: 9.99 },
      { condition: 'Damaged', quantity: 0, price: 4.99 }
    ]
  },
  {
    cardId: 'EF56GH78',
    name: 'Shadow Assassin',
    thumbnail: null,
    conditions: [
      { condition: 'Near Mint', quantity: 5, price: 149.99 },
      { condition: 'Lightly Played', quantity: 3, price: 119.99 },
      { condition: 'Moderately Played', quantity: 0, price: 89.99 },
      { condition: 'Heavily Played', quantity: 0, price: 59.99 },
      { condition: 'Damaged', quantity: 0, price: 29.99 }
    ]
  },
  {
    cardId: 'IJ90KL12',
    name: 'Crystal Guardian',
    thumbnail: null,
    conditions: [
      { condition: 'Near Mint', quantity: 15, price: 89.50 },
      { condition: 'Lightly Played', quantity: 6, price: 74.50 },
      { condition: 'Moderately Played', quantity: 2, price: 59.50 },
      { condition: 'Heavily Played', quantity: 0, price: 44.50 },
      { condition: 'Damaged', quantity: 0, price: 29.50 }
    ]
  },
  {
    cardId: 'MN34OP56',
    name: 'Phoenix Warrior',
    thumbnail: null,
    conditions: [
      { condition: 'Near Mint', quantity: 3, price: 299.99 },
      { condition: 'Lightly Played', quantity: 2, price: 249.99 },
      { condition: 'Moderately Played', quantity: 0, price: 199.99 },
      { condition: 'Heavily Played', quantity: 0, price: 149.99 },
      { condition: 'Damaged', quantity: 0, price: 99.99 }
    ]
  },
  {
    cardId: 'QR78ST90',
    name: 'Frost Elemental',
    thumbnail: null,
    conditions: [
      { condition: 'Near Mint', quantity: 8, price: 45.75 },
      { condition: 'Lightly Played', quantity: 4, price: 38.50 },
      { condition: 'Moderately Played', quantity: 0, price: 31.25 },
      { condition: 'Heavily Played', quantity: 0, price: 24.00 },
      { condition: 'Damaged', quantity: 0, price: 16.50 }
    ]
  },
  {
    cardId: 'ST12UV34',
    name: 'Okina, Temple to the Grandfathers',
    thumbnail: null,
    conditions: [
      { condition: 'Near Mint', quantity: 2, price: 89.99 },
      { condition: 'Lightly Played', quantity: 1, price: 74.99 },
      { condition: 'Moderately Played', quantity: 0, price: 59.99 },
      { condition: 'Heavily Played', quantity: 0, price: 44.99 },
      { condition: 'Damaged', quantity: 0, price: 29.99 }
    ]
  },
  {
    cardId: 'WX56YZ78',
    name: 'Our Market Research Shows That Players Like Really Long Card Names So We Made This Card To Have The Absolute Longest Card Name Ever',
    thumbnail: null,
    conditions: [
      { condition: 'Near Mint', quantity: 1, price: 199.99 },
      { condition: 'Lightly Played', quantity: 0, price: 159.99 },
      { condition: 'Moderately Played', quantity: 0, price: 119.99 },
      { condition: 'Heavily Played', quantity: 0, price: 89.99 },
      { condition: 'Damaged', quantity: 0, price: 59.99 }
    ]
  }
];

@customElement('ogs-inventory-page')
export class InventoryPage extends LitElement {
  static styles = [
    css`${unsafeCSS(nativeStyle)}`,
    css`${unsafeCSS(utilityStyles)}`,
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
    `
  ]

  private _inventory = [...mockInventory];
  private _searchTerm = '';

  private _handleSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this._searchTerm = input.value.toLowerCase();
    this.requestUpdate();
  }

  private _getFilteredInventory() {
    if (!this._searchTerm) {
      return this._inventory;
    }
    
    return this._inventory.filter(item =>
      item.cardId.toLowerCase().includes(this._searchTerm) ||
      item.name.toLowerCase().includes(this._searchTerm) ||
      item.conditions.some(condition =>
        condition.condition.toLowerCase().includes(this._searchTerm) ||
        condition.quantity.toString().includes(this._searchTerm) ||
        condition.price.toString().includes(this._searchTerm)
      )
    );
  }

  render() {
    const filteredInventory = this._getFilteredInventory();
    
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
              @input="${this._handleSearch}"
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
                ${filteredInventory.flatMap(item =>
                  item.conditions.map((condition, conditionIndex) => html`
                    <tr>
                      <td>
                        ${item.thumbnail
                          ? html`<img src="${item.thumbnail}" alt="${item.name}" class="card-thumbnail">`
                          : html`<wa-icon name="id-card" variant="regular" class="card-thumbnail"></wa-icon>`
                        }
                      </td>
                      <td>
                        <a href="/inventory/${item.cardId}" class="card-name-link">
                          ${item.name.length > 31 ? item.name.substring(0, 31) + '...' : item.name}
                        </a>
                      </td>
                      <td class="price-cell">$${condition.price.toFixed(2)}</td>
                      <td class="quantity-cell">${condition.quantity}</td>
                      <td>${condition.condition}</td>
                      <td>
                        <div class="cart-controls">
                          <div class="quantity-input">
                            <wa-input type="number" min="1" max="99" placeholder="Qty" value="1" style="width: 60px;"></wa-input>
                          </div>
                          <wa-button appearance="filled" class="add-to-cart">
                            <wa-icon name="cart-plus"></wa-icon>
                          </wa-button>
                        </div>
                      </td>
                    </tr>
                  `)
                )}
              </tbody>
            </table>
          </div>
        </wa-card>
      </ogs-page>
    `
  }
}