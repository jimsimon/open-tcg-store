import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import nativeStyle from "@awesome.me/webawesome/dist/styles/native.css?inline";
import utilityStyles from "@awesome.me/webawesome/dist/styles/utilities.css?inline";
import "../../components/ogs-page.ts";

@customElement("ogs-orders-page")
export class OrdersPage extends LitElement {
  @property({ type: String }) userRole = "";
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = "";

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
        font-size: var(--wa-font-size-s);
      }

      .placeholder {
        text-align: center;
        padding: 4rem 2rem;
        color: var(--wa-color-text-muted);
      }

      .placeholder wa-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .placeholder h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-text-normal);
      }

      .placeholder p {
        margin: 0;
        max-width: 400px;
        margin-inline: auto;
      }
    `,
  ];

  render() {
    return html`
      <ogs-page
        activePage="Orders"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
      >
        <div class="page-header">
          <div class="page-header-icon">
            <wa-icon name="receipt" style="font-size: 1.5rem;"></wa-icon>
          </div>
          <div class="page-header-content">
            <h2>Orders</h2>
            <p>View and manage customer orders</p>
          </div>
        </div>

        <div class="placeholder">
          <wa-icon name="receipt"></wa-icon>
          <h3>Coming Soon</h3>
          <p>Order management and history will appear here.</p>
        </div>
      </ogs-page>
    `;
  }
}
