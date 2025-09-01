import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import '@awesome.me/webawesome/dist/components/card/card.js'
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline'
import "../../components/ogs-page.ts";

@customElement('ogs-home-page')
export class HomePage extends LitElement {
  static styles = [
    css`${unsafeCSS(utilityStyles)}`,
    css`
      :host {
        box-sizing: border-box;
      }
    `
  ]

  render() {
    return html`
      <ogs-page activePage="Dashboard">
        <h1>Dashboard</h1>
        <div class="wa-grid">
          <wa-card appearance="filled">
            <h2 slot="header">Monthly Sales</h2>
            <p>Sales data goes here</p>
          </wa-card>
           <wa-card appearance="filled">
            <h2 slot="header">Best Sellers</h2>
            <p>Best seller data goes here</p>
          </wa-card>
        </div>
      </ogs-page>
    `
  }
}