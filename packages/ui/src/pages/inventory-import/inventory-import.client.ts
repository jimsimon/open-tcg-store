import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import { OgsPageBase } from '../../components/ogs-page-base.ts';

@customElement('ogs-inventory-import-page')
export class OgsInventoryImportPage extends OgsPageBase {
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

      .import-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        gap: 1.5rem;
        max-width: 500px;
        margin: 0 auto;
      }

      .coming-soon-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 5rem;
        height: 5rem;
        border-radius: var(--wa-border-radius-l);
        background: var(--wa-color-surface-alt);
        color: var(--wa-color-text-muted);
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      .import-container h3 {
        margin: 0;
        font-size: var(--wa-font-size-xl);
        font-weight: 600;
      }

      .import-container p {
        margin: 0;
        color: var(--wa-color-text-muted);
        text-align: center;
        max-width: 360px;
      }

      .feature-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        width: 100%;
        max-width: 360px;
      }

      .feature-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-secondary);
      }

      .feature-item wa-icon {
        color: var(--wa-color-brand-text);
        flex-shrink: 0;
      }

      .nav-links {
        display: flex;
        gap: var(--wa-space-m);
        flex-wrap: wrap;
        justify-content: center;
        margin-top: var(--wa-space-m);
      }
    `,
  ];

  render() {
    return this.renderPage(
      html`
        <div class="page-header">
          <div class="page-header-icon">
            <wa-icon name="upload" style="font-size: 1.5rem;"></wa-icon>
          </div>
          <div class="page-header-content">
            <h2>Import Inventory</h2>
            <p>Bulk import inventory from CSV files and other sources</p>
          </div>
        </div>

        <div class="import-container">
          <div class="coming-soon-icon">
            <wa-icon name="upload"></wa-icon>
          </div>
          <h3>Coming Soon</h3>
          <p>Import inventory from CSV files, spreadsheets, and other sources to quickly populate your inventory.</p>

          <div class="feature-list">
            <div class="feature-item">
              <wa-icon name="file-csv"></wa-icon>
              <span>Import from CSV and Excel files</span>
            </div>
            <div class="feature-item">
              <wa-icon name="tags"></wa-icon>
              <span>Map columns automatically to inventory fields</span>
            </div>
            <div class="feature-item">
              <wa-icon name="check"></wa-icon>
              <span>Validate data before importing</span>
            </div>
            <div class="feature-item">
              <wa-icon name="clock"></wa-icon>
              <span>Track acquisition dates and cost basis</span>
            </div>
          </div>

          <div class="nav-links">
            <wa-button appearance="outlined" variant="neutral" href="/inventory/singles">
              <wa-icon slot="start" name="id-card"></wa-icon>
              Back to Singles
            </wa-button>
            <wa-button appearance="outlined" variant="neutral" href="/inventory/sealed">
              <wa-icon slot="start" name="package"></wa-icon>
              Back to Sealed
            </wa-button>
          </div>
        </div>
      `,
      {},
    );
  }
}
