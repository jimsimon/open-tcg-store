import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';

const STATUS_POLL_INTERVAL_MS = 5000;

@customElement('ogs-maintenance-page')
export class OgsMaintenancePage extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: var(--wa-space-l);
    }

    .container {
      text-align: center;
      max-width: 480px;
    }

    wa-spinner {
      font-size: 3rem;
      --indicator-color: var(--wa-color-brand-normal);
      --track-color: var(--wa-color-surface-raised);
    }

    h1 {
      margin-top: var(--wa-space-l);
      margin-bottom: var(--wa-space-s);
      font-size: var(--wa-font-size-xl);
      color: var(--wa-color-text-normal);
    }

    p {
      color: var(--wa-color-text-muted);
      line-height: var(--wa-line-height-normal);
    }
  `;

  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._startPolling();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopPolling();
  }

  private _startPolling() {
    this._pollTimer = setInterval(() => this._checkStatus(), STATUS_POLL_INTERVAL_MS);
  }

  private _stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  private async _checkStatus() {
    try {
      const res = await fetch('http://localhost:5174/api/status', {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = (await res.json()) as { databaseUpdating: boolean };
      if (!data.databaseUpdating) {
        this._stopPolling();
        window.location.href = '/';
      }
    } catch {
      // API unreachable, keep polling
    }
  }

  render() {
    return html`
      <div class="container">
        <wa-spinner></wa-spinner>
        <h1>Updating Product Database</h1>
        <p>The product database is being updated with the latest data. This usually takes less than a minute.</p>
        <p>This page will refresh automatically when the update is complete.</p>
      </div>
    `;
  }
}
