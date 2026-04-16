import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, queryAssignedElements, state } from 'lit/decorators.js';

import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';

import { when } from 'lit/directives/when.js';

@customElement('ogs-wizard')
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

    wa-button[variant='brand'] {
      margin-left: auto;
    }
  `;

  @state()
  @queryAssignedElements({ flatten: true, selector: 'ogs-wizard-item' })
  items: OgsWizardItem[] = [];

  // Not reactive — we trigger a re-render explicitly after the first update
  // to avoid "scheduled an update after an update completed" warnings.
  firstUpdateCompleted = false;

  @property({ type: Number })
  activeIndex = 0;

  render() {
    return html`
      <wa-card appearance="filled">
        <h1 slot="header">
          ${this.firstUpdateCompleted && this.items.length > 0 ? this.items[this.activeIndex].heading : nothing}
        </h1>
        <section>
          <slot></slot>
        </section>
        <nav slot="footer" aria-label="Wizard navigation">
          ${when(
            this.shouldShowPrevious(),
            () => html`
              <wa-button appearance="outlined" variant="neutral" @click="${this.previous}"> Previous </wa-button>
            `,
          )}
          ${when(
            this.shouldShowNext(),
            () => html` <wa-button variant="brand" @click="${this.next}"> Next </wa-button> `,
          )}
          ${when(
            this.shouldShowSave(),
            () => html` <wa-button variant="success" @click="${this.save}"> Save </wa-button> `,
          )}
        </nav>
      </wa-card>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.handleKeyDown);
  }

  async firstUpdated() {
    this.updateItemVisibility();
    this.focusFirstElement();
    // Wait for the current update to fully settle before scheduling a new one.
    // Setting firstUpdateCompleted synchronously inside firstUpdated would
    // schedule a re-render during the update cycle, triggering Lit's
    // "change-in-update" warning.
    await this.updateComplete;
    this.firstUpdateCompleted = true;
    this.requestUpdate();
  }

  shouldShowPrevious() {
    return this.firstUpdateCompleted && this.items.length > 0 && this.activeIndex > 0;
  }

  shouldShowNext() {
    return this.firstUpdateCompleted && this.items.length > 0 && this.activeIndex < this.items.length - 1;
  }

  shouldShowSave() {
    return this.firstUpdateCompleted && this.items.length > 0 && this.activeIndex === this.items.length - 1;
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;

    const target = event.composedPath()[0] as HTMLElement;
    const tagName = target?.tagName?.toLowerCase();

    // Only handle Enter from input-like elements (native or web component internals)
    if (tagName !== 'input' && tagName !== 'wa-input' && tagName !== 'textarea') return;

    // Don't advance if the target is a textarea (multiline input)
    if (tagName === 'textarea') return;

    event.preventDefault();

    if (this.shouldShowNext()) {
      this.next();
    } else if (this.shouldShowSave()) {
      this.save();
    }
  };

  next() {
    if (this.activeIndex < this.items.length - 1) {
      this.activeIndex++;
      this.updateItemVisibility();
      this.focusFirstElement();
    }
  }

  previous() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
      this.updateItemVisibility();
      this.focusFirstElement();
    }
  }

  save() {
    const event = new Event('ogs-wizard-save-click', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  updateItemVisibility() {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].style.display = i !== this.activeIndex ? 'none' : 'block';
    }
  }

  private focusFirstElement() {
    requestAnimationFrame(() => {
      const activeItem = this.items[this.activeIndex];
      if (!activeItem) return;

      // Try to find the first focusable element in the active wizard step
      const focusable = activeItem.querySelector<HTMLElement>(
        'wa-input, wa-select, wa-textarea, wa-button, input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable) {
        focusable.focus();
        return;
      }

      // If no focusable element in the step, focus the Next/Save button in the footer
      const footerButton = this.shadowRoot?.querySelector<HTMLElement>(
        'nav wa-button[variant="brand"], nav wa-button[variant="success"]',
      );
      footerButton?.focus();
    });
  }
}

@customElement('ogs-wizard-item')
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
