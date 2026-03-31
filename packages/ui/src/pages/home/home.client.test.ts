import { afterEach, beforeEach, describe, expect, test } from "vitest";
import "./home.client";
import { HomePage } from "./home.client";

describe("ogs-home-page", () => {
  let element: HomePage;
  beforeEach(async () => {
    element = document.createElement("ogs-home-page") as HomePage;
    document.body.appendChild(element);

    // Wait for the component to render
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  test("dashboard content is present", async () => {
    // Check if dashboard title is present (h2 heading in the page header)
    const dashboardTitle = element.shadowRoot!.querySelector("h2");
    expect(dashboardTitle).toBeTruthy();
    expect(dashboardTitle!.textContent).toBe("Dashboard");

    // Check if dashboard cards are present (wa-card with slotted headers)
    const cards = element.shadowRoot!.querySelectorAll("wa-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);

    const cardHeaders = Array.from(cards).map((card) => card.querySelector('[slot="header"]')?.textContent?.trim());
    expect(cardHeaders).toContain("Monthly Sales");
    expect(cardHeaders).toContain("Best Sellers");
  });
});
