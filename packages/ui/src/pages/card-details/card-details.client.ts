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
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import nativeStyle from "@awesome.me/webawesome/dist/styles/native.css?inline";
import utilityStyles from "@awesome.me/webawesome/dist/styles/utilities.css?inline";
import "../../components/ogs-page.ts";
import { execute } from "../../lib/graphql.ts";
import { Card } from "../../graphql/graphql.ts";
import { graphql } from "../../graphql/gql.ts";

@customElement("ogs-card-details-page")
export class CardDetailsPage extends LitElement {
  static styles = [
    css`
      ${unsafeCSS(nativeStyle)}
    `,
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    css`
      caption {
        text-align: left;
        font-size: var(--wa-font-size-xl);
        font-family: var(--wa-font-family-heading);
        font-weight: var(--wa-font-weight-heading);
        line-height: var(--wa-line-height-condensed);
        color: var(--wa-color-text-normal);
        text-wrap: balance;
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
    `,
  ];

  @property()
  private game: string = "";

  @property()
  private cardId: string = "";

  @state()
  private card: Card | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.fetchCard();
  }

  async fetchCard() {
    const GetCardQuery = graphql(`
      query GetCardQuery($game: String!, $cardId: String!) {
        getCard(game: $game, cardId: $cardId) {
          id
          name
          rarity
          type
          text
          flavorText
          setName
          finishes
          images {
            small
            large
          }
          inventory {
            type
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
            HP {
              quantity
              price
            }
            D {
              quantity
              price
            }
          }
        }
      }
    `);

    const result = await execute(GetCardQuery, {
      game: this.game,
      cardId: this.cardId,
    });

    if (result?.errors?.length) {
      console.log({ result });
    } else {
      this.card = result.data.getCard;
    }
  }

  render() {
    return html`
      <ogs-page activePage="games/${this.game}/card-details">
        <h1>${this.card?.name}</h1>
        <div class="wa-stack">
          <wa-card appearance="outlined">
            <h2 slot="header">Details</h2>
            <div class="wa-flank wa-align-items-start" style="--flank-size: 20rem;">
              <div class="wa-frame wa-border-radius-m" style="aspect-ratio: auto;">
                <img src="${this.card?.images?.large}" alt="" />
              </div>
              <table class="wa-table wa-zebra-rows wa-hover-rows">
                <tbody>
                  <tr>
                    <th>Set</th>
                    <td>${this.card?.setName}</td>
                  </tr>
                  <tr>
                    <th>Type</th>
                    <td>${this.card?.type}</td>
                  </tr>
                  <tr>
                    <th>Rarity</th>
                    <td>${this.card?.rarity}</td>
                  </tr>
                  <tr>
                    <th>Printings</th>
                    <td>${this.card?.finishes?.map((f) => html` <wa-badge> ${f.toUpperCase()} </wa-badge> `)}</td>
                  </tr>
                  <tr>
                    <th>Text</th>
                    <td>${this.card?.text}</td>
                  </tr>
                  <tr>
                    <th>Flavor Text</th>
                    <td>${this.card?.flavorText ?? "N/A"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </wa-card>
          <wa-card appearance="outlined">
            <h2 slot="header">Pricing</h2>
            ${this.card?.inventory.map((i, index) => {
              return html`
                <table class="wa-table wa-zebra-rows wa-hover-rows">
                  <caption>
                    ${i?.type}
                  </caption>
                  <thead>
                    <tr>
                      <th>Condition</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th class="wa-visually-hidden">Add to cart</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Near Mint</td>
                      <td>${i?.NM.price}</td>
                      <td>${i?.NM.quantity}</td>
                      <td>
                        <div class="cart-controls">
                          <wa-input
                            type="number"
                            min="1"
                            max="99"
                            placeholder="Quantity"
                            value="1"
                            style="width: 100px;"
                          >
                            <span slot="label" class="wa-visually-hidden">Quantity</span>
                          </wa-input>
                          <wa-button appearance="filled" class="add-to-cart">
                            <wa-icon name="cart-plus" label="Add to cart"></wa-icon>
                          </wa-button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Lightly Played</td>
                      <td>${i?.LP.price}</td>
                      <td>${i?.LP.quantity}</td>
                      <td>
                        <div class="cart-controls">
                          <wa-input
                            type="number"
                            min="1"
                            max="99"
                            placeholder="Quantity"
                            value="1"
                            style="width: 100px;"
                          >
                            <span slot="label" class="wa-visually-hidden">Quantity</span>
                          </wa-input>
                          <wa-button appearance="filled" class="add-to-cart">
                            <wa-icon name="cart-plus" label="Add to cart"></wa-icon>
                          </wa-button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Moderately Played</td>
                      <td>${i?.MP.price}</td>
                      <td>${i?.MP.quantity}</td>
                      <td>
                        <div class="cart-controls">
                          <wa-input
                            type="number"
                            min="1"
                            max="99"
                            placeholder="Quantity"
                            value="1"
                            style="width: 100px;"
                          >
                            <span slot="label" class="wa-visually-hidden">Quantity</span>
                          </wa-input>
                          <wa-button appearance="filled" class="add-to-cart">
                            <wa-icon name="cart-plus" label="Add to cart"></wa-icon>
                          </wa-button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Heavily Played</td>
                      <td>${i?.HP?.price}</td>
                      <td>${i?.HP?.quantity}</td>
                      <td>
                        <div class="cart-controls">
                          <wa-input
                            type="number"
                            min="1"
                            max="99"
                            placeholder="Quantity"
                            value="1"
                            style="width: 100px;"
                          >
                            <span slot="label" class="wa-visually-hidden">Quantity</span>
                          </wa-input>
                          <wa-button appearance="filled" class="add-to-cart">
                            <wa-icon name="cart-plus" label="Add to cart"></wa-icon>
                          </wa-button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Damaged</td>
                      <td>${i?.D?.price}</td>
                      <td>${i?.D?.quantity}</td>
                      <td>
                        <div class="cart-controls">
                          <wa-input
                            type="number"
                            min="1"
                            max="99"
                            placeholder="Quantity"
                            value="1"
                            style="width: 100px;"
                          >
                            <span slot="label" class="wa-visually-hidden">Quantity</span>
                          </wa-input>
                          <wa-button appearance="filled" class="add-to-cart">
                            <wa-icon name="cart-plus" label="Add to cart"></wa-icon>
                          </wa-button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                ${index < (this.card?.inventory.length ?? 0) - 1
                  ? html`<wa-divider><wa-divier></wa-divier></wa-divider>`
                  : nothing}
              `;
            })}
          </wa-card>
        </div>
      </ogs-page>
    `;
  }
}
