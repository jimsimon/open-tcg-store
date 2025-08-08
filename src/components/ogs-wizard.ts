import { LitElement, css, html } from "lit";
import {
  customElement,
  property,
  queryAssignedElements,
  state,
} from "lit/decorators.js";
import "@material/web/button/filled-button.js";
import "@material/web/button/filled-tonal-button.js";
import "@material/web/button/outlined-button.js";
import "@material/web/elevation/elevation.js";
import { when } from "lit/directives/when.js";

@customElement("ogs-wizard")
export class OgsWizard extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      border: 1px solid;
      border-radius: 16px;
      color: var(--md-sys-color-primary);
      background-color: var(--md-sys-color-surface-container);
      padding: 0 2rem 1rem 2rem;
      --md-elevation-level: 3;
    }

    section {
      display: flex;
    }

    nav {
      display: flex;
      justify-content: space-between;
      padding-top: 1rem;
    }

    md-filled-tonal-button {
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
      <md-elevation></md-elevation>
      <section>
        <slot></slot>
      </section>
      <nav>
        ${when(
          this.shouldShowPrevious(),
          () => html`
            <md-outlined-button @click="${this.previous}">
              Previous
            </md-outlined-button>
          `,
        )}
        ${when(
          this.shouldShowNext(),
          () => html`
            <md-filled-tonal-button @click="${this.next}">
              Next
            </md-filled-tonal-button>
          `,
        )}
        ${when(
          this.shouldShowSave(),
          () => html`
            <md-filled-button @click="${this.save}"> Save </md-filled-button>
          `,
        )}
      </nav>
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

  render() {
    return html`<slot></slot>`;
  }
}
