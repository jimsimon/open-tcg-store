import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import '@awesome.me/webawesome/dist/components/divider/divider.js'

@customElement("ogs-two-pane-panel")
export class OgsTwoPanePanel extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    section:nth-of-type(1) {
      width: 50%;
    }

    section:nth-of-type(2) {
      width: 50%;
    }

    .panel {
      display: flex;
    }
  `;

  render() {
    return html`
      <div class="panel">
        <section>
          <slot name="start"></slot>
        </section>
        <div>
          <wa-divider orientation="vertical"></wa-divider>
        </div>
        <section>
          <slot name="end"></slot>
        </section>
      </div>
    `;
  }
}
