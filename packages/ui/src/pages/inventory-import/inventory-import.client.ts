import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../components/ogs-page.ts";

@customElement("ogs-inventory-import-page")
export class OgsInventoryImportPage extends LitElement {
  @property({ type: String }) userRole = "";
  @property({ type: Boolean }) isAnonymous = false;
  @property({ type: String }) userName = "";

  render() {
    return html`
      <ogs-page
        pageTitle="Import Inventory"
        userRole="${this.userRole}"
        ?isAnonymous="${this.isAnonymous}"
        userName="${this.userName}"
      >
        <div style="text-align: center; padding: 4rem 2rem;">
          <wa-icon name="upload" style="font-size: 4rem; color: var(--wa-color-neutral-400);"></wa-icon>
          <h2>Import Inventory</h2>
          <p>Coming Soon</p>
          <p style="color: var(--wa-color-neutral-500);">Import inventory from CSV files and other sources.</p>
          <wa-button variant="neutral" href="/inventory/singles">
            <wa-icon slot="prefix" name="arrow-left"></wa-icon>
            Back to Singles
          </wa-button>
          <wa-button variant="neutral" href="/inventory/sealed">
            <wa-icon slot="prefix" name="arrow-left"></wa-icon>
            Back to Sealed
          </wa-button>
        </div>
      </ogs-page>
    `;
  }
}
