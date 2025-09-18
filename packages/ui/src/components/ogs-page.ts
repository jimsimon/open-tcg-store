import { LitElement, PropertyValues, css, html, nothing, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import utilityStyles from "@awesome.me/webawesome/dist/styles/utilities.css?inline";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/option/option.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "@awesome.me/webawesome/dist/components/avatar/avatar.js";
import WaSelect from "@awesome.me/webawesome/dist/components/select/select.js";
import Cookies from "js-cookie";
import { graphql } from "../graphql";
import { execute } from "../lib/graphql";
import { ShoppingCart } from "../graphql/graphql";
import { number } from "better-auth";

@customElement("ogs-page")
export class OgsPage extends LitElement {
  static styles = [
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    css`
      :host {
        display: block;
        box-sizing: border-box;
      }

      :root {
        height: 100%;
      }

      #page {
        display: flex;
        height: calc(100% - 84px);
      }

      header {
        box-sizing: border-box;
        border-bottom: var(--wa-border-style) var(--wa-panel-border-width) var(--wa-color-surface-border);
        padding-inline: var(--wa-space-xl);
        padding-inline-end: var(--wa-space-s);
        block-size: 84px;
      }

      nav {
        display: flex;
        flex-direction: column;
        column-gap: 1rem;
        overflow: auto;
        height: 100%;
        max-height: 100%;
        min-width: 300px;
        max-width: 300px;
        box-sizing: border-box;
        border-right: var(--wa-border-style) var(--wa-panel-border-width) var(--wa-color-surface-border);
        overflow-x: auto;
        overflow-y: auto;
      }

      ul {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin: 0;
        padding: 0;
      }

      li {
        padding: 1rem 2rem;
        list-style: none;
      }

      a {
        color: var(--wa-color-text-link);
        text-decoration: none;
      }

      a[current] {
        text-decoration: underline;
      }

      section {
        box-sizing: border-box;
        margin-inline: auto;
        max-width: 1200px;
        flex: 1;
      }

      [hidden] {
        display: none;
      }

      wa-button.avatar-button::part(base) {
        border-radius: 100%;
      }
    `,
  ];

  @property({ type: String })
  activePage?: string;

  @property({ type: Boolean })
  hideNav = false;

  @state()
  themePreference = Cookies.get("ogs-theme-preference") || "auto";

  @state()
  themeColor = this.determineThemeColor();

  @state()
  cart?: ShoppingCart;

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.updateThemeClass();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.fetchCart();
  }

  async fetchCart() {
    const GetShoppingCartQuery = graphql(`
      query GetShoppingCartQuery {
        getShoppingCart {
          items {
            quantity
            productId
            productName
          }
        }
      }
    `);

    const result = await execute(GetShoppingCartQuery);

    if (result?.errors?.length) {
      console.log({ result });
    } else {
      this.cart = result.data.getShoppingCart;
    }
  }

  render() {
    return html`
      <header class="wa-split">
        <h1>OpenTCGS</h1>
        <div class="wa-cluster">
          <wa-select
            class="color-scheme-selector"
            appearance="filled"
            value="${this.themePreference}"
            title="Press  to toggle"
            placement="bottom"
            @change="${this.handleThemePreferenceChange}"
          >
            <span slot="label" class="wa-visually-hidden">Choose Theme</span>
            <wa-icon
              class="only-light"
              slot="start"
              name="sun"
              variant="regular"
              .hidden="${this.themeColor === "dark"}"
            ></wa-icon>
            <wa-icon
              class="only-dark"
              slot="start"
              name="moon"
              variant="regular"
              .hidden="${this.themeColor === "light"}"
            ></wa-icon>
            <wa-option value="light">
              <wa-icon slot="start" name="sun" variant="regular"></wa-icon>
              Light
            </wa-option>
            <wa-option value="dark">
              <wa-icon slot="start" name="moon" variant="regular"></wa-icon>
              Dark
            </wa-option>
            <wa-divider role="separator" aria-orientation="horizontal" orientation="horizontal"></wa-divider>
            <wa-option value="auto">
              <wa-icon class="only-light" slot="start" name="sun" variant="regular"></wa-icon>
              <wa-icon class="only-dark" slot="start" name="moon" variant="regular"></wa-icon>
              System
            </wa-option>
          </wa-select>
          <wa-button appearance="filled">
            <wa-icon name="shopping-cart"></wa-icon>
            <wa-badge pill>${this.cart?.items.reduce<number>((total, item) => (total += item.quantity), 0) ?? 0}</wa-badge>
          </wa-button>
          <wa-divider orientation="vertical"></wa-divider>
          <wa-button class="avatar-button" appearance="filled">
            <wa-icon name="user" variant="solid"></wa-icon>
          </wa-button>
        </div>
      </header>
      <div id="page">
        ${when(
          !this.hideNav,
          () => html`
            <nav>
              <h2>${this.renderAnchor("/", "Dashboard", "Dashboard")}</h2>
              <h2>Cards</h2>
              <ul>
                <li>${this.renderAnchor("/games/magic/cards", "Magic", "games/magic/cards")}</li>
                <li>${this.renderAnchor("/games/pokemon/cards", "Pokemon", "games/pokemon/cards")}</li>
              </ul>
              <h2>${this.renderAnchor("/sales", "Sales", "Sales")}</h2>
            </nav>
          `,
          () => nothing,
        )}
        <section>
          <slot></slot>
        </section>
      </div>
    `;
  }

  handleThemePreferenceChange(event: Event) {
    const { value } = event.target as WaSelect;
    if (value && typeof value === "string") {
      Cookies.set("ogs-theme-preference", value);
      this.themePreference = value;
    }

    this.themeColor = this.determineThemeColor();
    this.updateThemeClass();
  }

  determineThemeColor() {
    if (this.themePreference === "auto") {
      const prefersDarkColorScheme = window.matchMedia("(prefers-color-scheme: dark)");
      if (prefersDarkColorScheme.matches) {
        document.querySelector("html")?.classList.add("wa-dark");
        return "dark";
      } else {
        document.querySelector("html")?.classList.remove("wa-dark");
        return "light";
      }
    }
    return this.themePreference;
  }

  updateThemeClass() {
    if (this.themeColor === "light") {
      document.querySelector("html")?.classList.remove("wa-dark");
    } else {
      document.querySelector("html")?.classList.add("wa-dark");
    }
  }

  renderAnchor(href: string, label: string, activationKey: string) {
    return html`<a href="${href}" ?current="${this.activePage === activationKey}">${label}</a>`;
  }
}
