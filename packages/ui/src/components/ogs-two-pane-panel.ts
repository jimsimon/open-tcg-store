import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import { BP_MOBILE } from '../lib/breakpoints';

@customElement('ogs-two-pane-panel')
export class OgsTwoPanePanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .panel {
      display: flex;
      flex-wrap: wrap;
    }

    section:nth-of-type(1),
    section:nth-of-type(2) {
      flex: 1;
      min-width: min(100%, 320px);
    }

    .divider-wrapper {
      display: flex;
      align-items: stretch;
    }

    /* Hide vertical divider when sections stack */
    @media (max-width: ${unsafeCSS(BP_MOBILE)}) {
      .divider-wrapper {
        display: none;
      }

      section:nth-of-type(1),
      section:nth-of-type(2) {
        width: 100%;
      }
    }
  `;

  render() {
    return html`
      <div class="panel">
        <section>
          <slot name="start"></slot>
        </section>
        <div class="divider-wrapper">
          <wa-divider orientation="vertical"></wa-divider>
        </div>
        <section>
          <slot name="end"></slot>
        </section>
      </div>
    `;
  }
}
