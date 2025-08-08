import { LitElement, css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import { when } from "lit/directives/when.js";

@customElement("ogs-page")
export class OgsPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      padding: 2rem;
    }

    nav {
      width: 100%;
      border-bottom: 1px solid var(--md-sys-color-outline);
      background-color: var(--md-sys-color-surface-container);
    }

    ul {
      display: flex;
      justify-content: center;
      margin: 0;
    }

    li {
      padding: 1rem 2rem;
      list-style: none;
    }

    a {
      height: 100%;
      width: 100%;
    }

    a[current] {
      color: red;
    }
  `;

  @property({ type: String })
  path?: string;

  @property({ type: Boolean })
  hideNav = false;

  render() {
    return html`
      ${when(
        !this.hideNav,
        () =>
          html` <nav>
            <ul>
              <li>${this.renderAnchor("/", "Dashboard")}</li>
              <li>${this.renderAnchor("/inventory", "Inventory")}</li>
              <li>${this.renderAnchor("/sales", "Sales")}</li>
              <li>${this.renderAnchor("/settings", "Settings")}</li>
            </ul>
          </nav>`,
        () => nothing,
      )}
      ${when(
        !this.hideNav,
        () => html`<slot name="side-nav"></slot>`,
        () => nothing,
      )}
      <slot></slot>
    `;
  }

  renderAnchor(href: string, label: string) {
    return html`<a href="${href}" ?current="${this.path === href}"
      >${label}</a
    >`;
  }
}
