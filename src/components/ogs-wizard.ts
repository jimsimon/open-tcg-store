import { LitElement, css, html, nothing } from "lit";
import {
  customElement,
  property,
  queryAssignedElements,
  state,
} from "lit/decorators.js";

import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';

import { when } from "lit/directives/when.js";

@customElement("ogs-wizard")
export class OgsWizard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    section {
      display: flex;
    }

    h1 {
      margin: 0;
    }

    nav {
      display: flex;
      justify-content: space-between;
    }

    wa-button[variant="brand"] {
      margin-left: auto;
    }
  `;

  @state()
  @queryAssignedElements({ flatten: true, selector: "ogs-wizard-item" })
  items: OgsWizardItem[] = [];

  @state()
  firstUpdateCompleted = false;

  @property({ type: Number })
  activeIndex = 0;

  render() {
    return html`
    <wa-card appearance="filled">
      <h1 slot="header">${this.firstUpdateCompleted && this.items.length > 0 ? this.items[this.activeIndex].heading : nothing}</h1>
      <section>
        <slot></slot>
      </section>
      <nav slot="footer">
        ${when(
          this.shouldShowPrevious(),
        () => html`
              <wa-button appearance="outlined" variant="neutral" @click="${this.previous}">
                Previous
              </wa-button>
            `,
        )}
        ${when(
          this.shouldShowNext(),
          () => html`
                <wa-button variant="brand" @click="${this.next}">
                  Next
                </wa-button>
              `,
        )}
        ${when(
          this.shouldShowSave(),
          () => html`
                <wa-button variant="success" @click="${this.save}"> Save </wa-button>
              `,
        )}
        </nav>
      </wa-card>
    `;
  }

  firstUpdated() {
    this.firstUpdateCompleted = true;
    this.updateItemVisibility();
  }

  shouldShowPrevious() {
    return (
      this.firstUpdateCompleted && this.items.length > 0 && this.activeIndex > 0
    );
  }

  shouldShowNext() {
    return (
      this.firstUpdateCompleted &&
      this.items.length > 0 &&
      this.activeIndex < this.items.length - 1
    );
  }

  shouldShowSave() {
    return (
      this.firstUpdateCompleted &&
      this.items.length > 0 &&
      this.activeIndex === this.items.length - 1
    );
  }

  next() {
    if (this.activeIndex < this.items.length - 1) {
      this.activeIndex++;
      this.updateItemVisibility();
    }
  }

  previous() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
      this.updateItemVisibility();
    }
  }

  save() {
    const event = new Event("ogs-wizard-save-click", {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  updateItemVisibility() {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].style.display = i !== this.activeIndex ? "none" : "block";
    }
  }
}

@customElement("ogs-wizard-item")
export class OgsWizardItem extends LitElement {
  static styles = css`
    :host {
      display: none;
    }
  `;

  @property()
  heading: string = '';

  render() {
    return html`<slot></slot>`;
  }
}
