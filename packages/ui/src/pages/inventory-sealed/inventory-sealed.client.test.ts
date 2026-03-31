import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Mock the GraphQL execute function so the component doesn't make real network requests.
vi.mock("../../lib/graphql.ts", () => ({
  execute: vi.fn().mockResolvedValue({
    data: {
      getInventory: {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 25,
        totalPages: 0,
      },
    },
  }),
}));

import "./inventory-sealed.client.ts";
import { OgsInventorySealedPage } from "./inventory-sealed.client.ts";
import { execute } from "../../lib/graphql.ts";

// --- Helpers ---

const mockExecute = execute as ReturnType<typeof vi.fn>;

function mockInventoryResponse(items: Record<string, unknown>[] = [], totalCount = 0, totalPages = 0) {
  return {
    data: {
      getInventory: {
        items,
        totalCount,
        page: 1,
        pageSize: 25,
        totalPages,
      },
    },
  };
}

function makeFakeSealedItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    productId: 200,
    productName: "Booster Box - Alpha",
    gameName: "Magic",
    setName: "Alpha",
    rarity: null,
    isSingle: false,
    isSealed: true,
    condition: "NM",
    quantity: 2,
    price: 500000,
    costBasis: 400000,
    acquisitionDate: "2024-01-15T00:00:00.000Z",
    notes: "Factory sealed",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-06-01T00:00:00.000Z",
    ...overrides,
  };
}

// --- Tests ---

describe("ogs-inventory-sealed-page", () => {
  let element: OgsInventorySealedPage;

  beforeEach(async () => {
    mockExecute.mockResolvedValue(mockInventoryResponse());

    element = document.createElement("ogs-inventory-sealed-page") as OgsInventorySealedPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  test("should render the component", async () => {
    expect(element).toBeInstanceOf(OgsInventorySealedPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test("should display the filter bar with Search and Game filters only", async () => {
    const searchInput = element.shadowRoot!.querySelector('wa-input[placeholder="Search by name..."]');
    expect(searchInput).toBeTruthy();

    const gameSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Game"]');
    expect(gameSelect).toBeTruthy();
  });

  test("should NOT display Condition or Product Type filters", async () => {
    const conditionSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Condition"]');
    expect(conditionSelect).toBeFalsy();

    const typeSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Product Type"]');
    expect(typeSelect).toBeFalsy();
  });

  test("should display the action bar with Add, Import, Bulk Edit, Bulk Delete buttons", async () => {
    const actionBar = element.shadowRoot!.querySelector(".action-bar");
    expect(actionBar).toBeTruthy();

    const buttons = actionBar!.querySelectorAll("wa-button");
    const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());

    expect(buttonTexts).toContain("Add Sealed");
    expect(buttonTexts).toContain("Import");
    expect(buttonTexts).toContain("Bulk Edit");
    expect(buttonTexts).toContain("Bulk Delete");
  });

  test("should render the inventory table WITHOUT Rarity and Condition columns", async () => {
    const items = [makeFakeSealedItem()];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    element.remove();
    element = document.createElement("ogs-inventory-sealed-page") as OgsInventorySealedPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const table = element.shadowRoot!.querySelector("table");
    expect(table).toBeTruthy();

    const headers = Array.from(table!.querySelectorAll("th")).map((th) => th.textContent?.trim());
    expect(headers).toContain("Product");
    expect(headers).toContain("Game");
    expect(headers).toContain("Set");
    expect(headers).not.toContain("Rarity");
    expect(headers).not.toContain("Condition");
    expect(headers).toContain("Qty");
    expect(headers).toContain("Price");
    expect(headers).toContain("Cost Basis");
    expect(headers).toContain("Actions");
  });

  test("should open edit dialog WITHOUT Condition field when edit button is clicked", async () => {
    const items = [makeFakeSealedItem()];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    element.remove();
    element = document.createElement("ogs-inventory-sealed-page") as OgsInventorySealedPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const actionCells = element.shadowRoot!.querySelectorAll(".actions-cell");
    expect(actionCells.length).toBeGreaterThan(0);

    const editBtn = actionCells[0].querySelector("wa-button");
    editBtn!.click();
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector('wa-dialog[label="Edit Sealed Item"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.hasAttribute("open")).toBe(true);

    // Should NOT have Condition select in the edit dialog
    const conditionSelect = dialog!.querySelector('wa-select[label="Condition"]');
    expect(conditionSelect).toBeFalsy();

    // Should have Quantity, Price, Cost Basis fields
    const quantityInput = dialog!.querySelector('wa-input[label="Quantity"]');
    const priceInput = dialog!.querySelector('wa-input[label="Price"]');
    const costBasisInput = dialog!.querySelector('wa-input[label="Cost Basis"]');
    expect(quantityInput).toBeTruthy();
    expect(priceInput).toBeTruthy();
    expect(costBasisInput).toBeTruthy();
  });

  test("should open bulk edit dialog WITHOUT Condition field", async () => {
    const items = [makeFakeSealedItem({ id: 1 })];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    element.remove();
    element = document.createElement("ogs-inventory-sealed-page") as OgsInventorySealedPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    // Select all items
    const headerCheckbox = element.shadowRoot!.querySelector("thead wa-checkbox");
    headerCheckbox!.dispatchEvent(new Event("change", { bubbles: true }));
    await element.updateComplete;

    // Click bulk edit
    const actionBar = element.shadowRoot!.querySelector(".action-bar");
    const buttons = Array.from(actionBar!.querySelectorAll("wa-button"));
    const bulkEditBtn = buttons.find((b) => b.textContent?.trim().startsWith("Bulk Edit"));
    bulkEditBtn!.click();
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector('wa-dialog[label="Bulk Edit Sealed"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.hasAttribute("open")).toBe(true);

    // Should NOT have Condition select in the bulk edit dialog
    const conditionSelect = dialog!.querySelector('wa-select[label="Condition"]');
    expect(conditionSelect).toBeFalsy();

    // Should have Quantity, Price, Cost Basis fields
    const quantityInput = dialog!.querySelector('wa-input[label="Quantity"]');
    const priceInput = dialog!.querySelector('wa-input[label="Price"]');
    const costBasisInput = dialog!.querySelector('wa-input[label="Cost Basis"]');
    expect(quantityInput).toBeTruthy();
    expect(priceInput).toBeTruthy();
    expect(costBasisInput).toBeTruthy();
  });

  test("should show loading spinner when loading", async () => {
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement("ogs-inventory-sealed-page") as OgsInventorySealedPage;
    document.body.appendChild(element);
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector("wa-spinner");
    expect(spinner).toBeTruthy();
  });

  test("should display empty state when no items", async () => {
    const emptyState = element.shadowRoot!.querySelector(".empty-state");
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain("No sealed products found");
  });

  test("should display pagination controls when multiple pages", async () => {
    const items = Array.from({ length: 25 }, (_, i) =>
      makeFakeSealedItem({ id: i + 1, productName: `Sealed Product ${i + 1}` }),
    );
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 50, 2));

    element.remove();
    element = document.createElement("ogs-inventory-sealed-page") as OgsInventorySealedPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const pagination = element.shadowRoot!.querySelector(".pagination");
    expect(pagination).toBeTruthy();

    const paginationButtons = pagination!.querySelectorAll("wa-button");
    expect(paginationButtons.length).toBeGreaterThanOrEqual(3); // prev + page numbers + next

    // Previous/Next buttons use chevron icons instead of text
    const prevButton = pagination!.querySelector('wa-button:first-of-type wa-icon[name="chevron-left"]');
    const nextButton = pagination!.querySelector('wa-button:last-of-type wa-icon[name="chevron-right"]');
    expect(prevButton).toBeTruthy();
    expect(nextButton).toBeTruthy();
  });
});
