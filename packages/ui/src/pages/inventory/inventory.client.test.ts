import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { screen } from "shadow-dom-testing-library";

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

import "./inventory.client.ts";
import { OgsInventoryPage } from "./inventory.client.ts";
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

function makeFakeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    productId: 100,
    productName: "Black Lotus",
    gameName: "Magic",
    setName: "Alpha",
    rarity: "Mythic Rare",
    isSingle: true,
    isSealed: false,
    condition: "NM",
    quantity: 4,
    price: 50000,
    costBasis: 40000,
    acquisitionDate: "2024-01-15T00:00:00.000Z",
    notes: "Graded",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-06-01T00:00:00.000Z",
    ...overrides,
  };
}

// --- Tests ---

describe("ogs-inventory-page", () => {
  let element: OgsInventoryPage;

  beforeEach(async () => {
    // Reset mock to default empty response
    mockExecute.mockResolvedValue(mockInventoryResponse());

    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
    vi.clearAllMocks();
  });

  test("should render the component", async () => {
    expect(element).toBeInstanceOf(OgsInventoryPage);
    expect(element.shadowRoot).toBeTruthy();
  });

  test("should display the filter bar with all filter controls", async () => {
    // Search input
    const searchInput = element.shadowRoot!.querySelector('wa-input[placeholder="Search products..."]');
    expect(searchInput).toBeTruthy();

    // Game filter select
    const gameSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Game"]');
    expect(gameSelect).toBeTruthy();

    // Condition filter select
    const conditionSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Condition"]');
    expect(conditionSelect).toBeTruthy();

    // Product type filter select
    const typeSelect = element.shadowRoot!.querySelector('wa-select[placeholder="Product Type"]');
    expect(typeSelect).toBeTruthy();
  });

  test("should display the action bar with Add, Import, Bulk Edit, Bulk Delete buttons", async () => {
    const actionBar = element.shadowRoot!.querySelector(".action-bar");
    expect(actionBar).toBeTruthy();

    const buttons = actionBar!.querySelectorAll("wa-button");
    const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());

    expect(buttonTexts).toContain("Add Item");
    expect(buttonTexts).toContain("Import");
    expect(buttonTexts).toContain("Bulk Edit");
    expect(buttonTexts).toContain("Bulk Delete");
  });

  test("should disable bulk action buttons when no items are selected", async () => {
    const actionBar = element.shadowRoot!.querySelector(".action-bar");
    const buttons = Array.from(actionBar!.querySelectorAll("wa-button"));

    const bulkEditBtn = buttons.find((b) => b.textContent?.trim().startsWith("Bulk Edit"));
    const bulkDeleteBtn = buttons.find((b) => b.textContent?.trim().startsWith("Bulk Delete"));

    expect(bulkEditBtn?.hasAttribute("disabled")).toBe(true);
    expect(bulkDeleteBtn?.hasAttribute("disabled")).toBe(true);
  });

  test("should render the inventory table with correct columns", async () => {
    const items = [makeFakeItem()];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    // Re-create element to trigger fresh fetch
    element.remove();
    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);
    await element.updateComplete;

    // Wait for async fetch to complete
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const table = element.shadowRoot!.querySelector("table");
    expect(table).toBeTruthy();

    const headers = Array.from(table!.querySelectorAll("th")).map((th) => th.textContent?.trim());
    expect(headers).toContain("Product");
    expect(headers).toContain("Game");
    expect(headers).toContain("Set");
    expect(headers).toContain("Rarity");
    expect(headers).toContain("Condition");
    expect(headers).toContain("Qty");
    expect(headers).toContain("Price");
    expect(headers).toContain("Cost Basis");
    expect(headers).toContain("Actions");
  });

  test("should show loading spinner when loading", async () => {
    // Make execute hang so loading state persists
    mockExecute.mockReturnValue(new Promise(() => {}));

    element.remove();
    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);

    // Don't await updateComplete fully since fetch never resolves
    await new Promise((r) => setTimeout(r, 50));

    const spinner = element.shadowRoot!.querySelector("wa-spinner");
    expect(spinner).toBeTruthy();
  });

  test("should display error message when error occurs", async () => {
    mockExecute.mockRejectedValue(new Error("Network failure"));

    element.remove();
    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);
    await element.updateComplete;

    // Wait for async fetch to complete and error to be set
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const alert = element.shadowRoot!.querySelector("wa-alert");
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain("Network failure");
  });

  test("should open add dialog when Add button is clicked", async () => {
    const actionBar = element.shadowRoot!.querySelector(".action-bar");
    const buttons = Array.from(actionBar!.querySelectorAll("wa-button"));
    const addBtn = buttons.find((b) => b.textContent?.trim() === "Add Item");

    expect(addBtn).toBeTruthy();
    addBtn!.click();
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector('wa-dialog[label="Add Inventory Item"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.hasAttribute("open")).toBe(true);
  });

  test("should open edit dialog when edit button is clicked", async () => {
    const items = [makeFakeItem()];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    element.remove();
    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    // Find the edit button (first small button with pencil icon in actions cell)
    const actionCells = element.shadowRoot!.querySelectorAll(".actions-cell");
    expect(actionCells.length).toBeGreaterThan(0);

    const editBtn = actionCells[0].querySelector("wa-button");
    expect(editBtn).toBeTruthy();
    editBtn!.click();
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector('wa-dialog[label="Edit Inventory Item"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.hasAttribute("open")).toBe(true);
  });

  test("should open delete dialog when delete button is clicked", async () => {
    const items = [makeFakeItem()];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    element.remove();
    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    // Find the delete button (second small button in actions cell)
    const actionCells = element.shadowRoot!.querySelectorAll(".actions-cell");
    expect(actionCells.length).toBeGreaterThan(0);

    const buttons = actionCells[0].querySelectorAll("wa-button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    const deleteBtn = buttons[1]; // second button is delete
    deleteBtn.click();
    await element.updateComplete;

    const dialog = element.shadowRoot!.querySelector('wa-dialog[label="Delete Inventory Item"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.hasAttribute("open")).toBe(true);
  });

  test("should toggle select all checkbox", async () => {
    const items = [makeFakeItem({ id: 1 }), makeFakeItem({ id: 2, productName: "Mox Pearl" })];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 2, 1));

    element.remove();
    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    // Find the select-all checkbox in the table header
    const headerCheckbox = element.shadowRoot!.querySelector("thead wa-checkbox");
    expect(headerCheckbox).toBeTruthy();

    // Simulate change event to toggle select all
    headerCheckbox!.dispatchEvent(new Event("wa-change", { bubbles: true }));
    await element.updateComplete;

    // All row checkboxes should now be checked
    const rowCheckboxes = element.shadowRoot!.querySelectorAll("tbody wa-checkbox");
    for (const cb of rowCheckboxes) {
      expect(cb.hasAttribute("checked")).toBe(true);
    }
  });

  test("should track individual row selection", async () => {
    const items = [makeFakeItem({ id: 1 }), makeFakeItem({ id: 2, productName: "Mox Pearl" })];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 2, 1));

    element.remove();
    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    // Click the first row's checkbox
    const rowCheckboxes = element.shadowRoot!.querySelectorAll("tbody wa-checkbox");
    expect(rowCheckboxes.length).toBe(2);

    rowCheckboxes[0].dispatchEvent(new Event("wa-change", { bubbles: true }));
    await element.updateComplete;

    // First checkbox should be checked, second should not
    expect(rowCheckboxes[0].hasAttribute("checked")).toBe(true);
    expect(rowCheckboxes[1].hasAttribute("checked")).toBe(false);
  });

  test("should enable bulk action buttons when items are selected", async () => {
    const items = [makeFakeItem({ id: 1 })];
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 1, 1));

    element.remove();
    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    // Select the item via the header checkbox (select all)
    const headerCheckbox = element.shadowRoot!.querySelector("thead wa-checkbox");
    headerCheckbox!.dispatchEvent(new Event("wa-change", { bubbles: true }));
    await element.updateComplete;

    // Bulk action buttons should now be enabled
    const actionBar = element.shadowRoot!.querySelector(".action-bar");
    const buttons = Array.from(actionBar!.querySelectorAll("wa-button"));
    const bulkEditBtn = buttons.find((b) => b.textContent?.trim().startsWith("Bulk Edit"));
    const bulkDeleteBtn = buttons.find((b) => b.textContent?.trim().startsWith("Bulk Delete"));

    expect(bulkEditBtn?.hasAttribute("disabled")).toBe(false);
    expect(bulkDeleteBtn?.hasAttribute("disabled")).toBe(false);
  });

  test("should display pagination controls", async () => {
    const items = Array.from({ length: 25 }, (_, i) => makeFakeItem({ id: i + 1, productName: `Card ${i + 1}` }));
    mockExecute.mockResolvedValue(mockInventoryResponse(items, 50, 2));

    element.remove();
    element = document.createElement("ogs-inventory-page") as OgsInventoryPage;
    document.body.appendChild(element);
    await element.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    await element.updateComplete;

    const pagination = element.shadowRoot!.querySelector(".pagination");
    expect(pagination).toBeTruthy();

    // Should have Previous and Next buttons
    const paginationButtons = pagination!.querySelectorAll("wa-button");
    const buttonTexts = Array.from(paginationButtons).map((b) => b.textContent?.trim());
    expect(buttonTexts).toContain("Previous");
    expect(buttonTexts).toContain("Next");

    // Should show pagination info
    const info = pagination!.querySelector(".pagination-info");
    expect(info).toBeTruthy();
    expect(info?.textContent).toContain("50");
  });
});
