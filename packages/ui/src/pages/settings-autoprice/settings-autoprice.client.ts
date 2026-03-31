import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../../components/ogs-page.ts';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';

@customElement('ogs-settings-autoprice-page')
export class OgsSettingsAutopricePage extends LitElement {
  @property({ type: String }) userRole = '';
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = '';

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

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      /* --- Page Header --- */

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

      /* --- Empty / Coming Soon State --- */

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 4rem 2rem;
        color: var(--wa-color-text-muted);
        background: var(--wa-color-surface-raised);
        border: 2px dashed var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        margin: 0.5rem 0;
      }

      .empty-state > wa-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-text-normal);
      }

      .empty-state p {
        margin: 0 0 1.5rem 0;
        max-width: 500px;
        margin-inline: auto;
        line-height: 1.6;
      }

      .feature-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: center;
        margin-top: 0.5rem;
      }

      .feature-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--wa-color-surface-alt);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-pill);
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-normal);
      }

      .feature-item wa-icon {
        color: var(--wa-color-brand-text);
        font-size: 0.875rem;
      }
    `,
  ];

  render() {
    return html`
      <ogs-page
        activePage="settings/autoprice"
        ?showUserMenu="${true}"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
      >
        <div class="page-header">
          <div class="page-header-icon">
            <wa-icon name="wand-magic-sparkles" style="font-size: 1.5rem;"></wa-icon>
          </div>
          <div class="page-header-content">
            <h2>Autoprice</h2>
            <p>Automatically price your inventory based on market data</p>
          </div>
        </div>

        <div class="empty-state">
          <wa-icon name="wand-magic-sparkles"></wa-icon>
          <h3>Autoprice Configuration Coming Soon</h3>
          <p>
            This feature will allow you to automatically set prices for your inventory based on market data, pricing
            rules, and competitive analysis. Configure pricing strategies, set margins, and let the system keep your
            prices competitive automatically.
          </p>
          <div class="feature-list">
            <div class="feature-item">
              <wa-icon name="chart-line"></wa-icon>
              Market-based pricing
            </div>
            <div class="feature-item">
              <wa-icon name="sliders"></wa-icon>
              Custom margin rules
            </div>
            <div class="feature-item">
              <wa-icon name="clock-rotate-left"></wa-icon>
              Scheduled repricing
            </div>
            <div class="feature-item">
              <wa-icon name="shield-halved"></wa-icon>
              Price floor protection
            </div>
          </div>
        </div>
      </ogs-page>
    `;
  }
}
