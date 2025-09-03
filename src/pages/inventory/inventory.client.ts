import { html, LitElement } from "lit";
import "../../components/ogs-page.ts";

export class InventoryPage extends LitElement {
    render() {
        return html`
            <ogs-page activePage="Inventory">
                <h1>Inventory</h1>
            </ogs-page>
        `
    }
}