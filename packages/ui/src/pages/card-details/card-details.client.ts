import { css, html, LitElement, unsafeCSS } from "lit";
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
                    <td>Coming Soon!</td>
                  </tr>
                  <tr>
                    <th>Rarity</th>
                    <td>${this.card?.finishes?.map((f) => html` <wa-badge> ${f.toUpperCase()} </wa-badge> `)}</td>
                  </tr>
                  <tr>
                    <th>Text</th>
                    <td>Coming Soon!</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </wa-card>
          <wa-card appearance="outlined">
            <h2 slot="header">Pricing</h2>
            <table class="wa-table wa-zebra-rows wa-hover-rows">
              <thead>
                <tr>
                  <th>Condition</th>
                  <th>Price</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Near Mint</td>
                  <td>${this.card?.inventory.NM.price}</td>
                  <td>${this.card?.inventory.NM.quantity}</td>
                </tr>
                <tr>
                  <td>Lightly Played</td>
                  <td>${this.card?.inventory.LP.price}</td>
                  <td>${this.card?.inventory.LP.quantity}</td>
                </tr>
                <tr>
                  <td>Moderately Played</td>
                  <td>${this.card?.inventory.MP.price}</td>
                  <td>${this.card?.inventory.MP.quantity}</td>
                </tr>
                <tr>
                  <td>Heavily Played</td>
                  <td>${this.card?.inventory.HP?.price}</td>
                  <td>${this.card?.inventory.HP?.quantity}</td>
                </tr>
                <tr>
                  <td>Damaged</td>
                  <td>${this.card?.inventory.D?.price}</td>
                  <td>${this.card?.inventory.D?.quantity}</td>
                </tr>
              </tbody>
            </table>
          </wa-card>
        </div>
      </ogs-page>
    `;
  }
}
