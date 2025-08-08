import { CSSResultGroup, LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

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

    div {
      display: flex;
    }
  `;

  render() {
    return html`
      <div>
        <section>
          <slot name="start"></slot>
        </section>
        <section>
          <slot name="end"></slot>
        </section>
      </div>
    `;
  }
}
