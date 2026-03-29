import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { screen } from "shadow-dom-testing-library";
import "./ogs-page.ts";
import { OgsPage } from "./ogs-page.ts";

// Mock the auth client
vi.mock("../auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
    signUp: {
      email: vi.fn(),
    },
    signOut: vi.fn(),
  },
}));

// Mock the graphql execute function to prevent network calls
vi.mock("../lib/graphql", () => ({
  execute: vi.fn().mockResolvedValue({
    data: { getShoppingCart: { items: [] } },
  }),
}));

describe("ogs-page", () => {
  let element: OgsPage;

  beforeEach(async () => {
    element = document.createElement("ogs-page") as OgsPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  test("renders page component with navigation", async () => {
    const navigation = await screen.findByShadowRole("navigation");
    expect(navigation).toBeInTheDocument();

    const dashboardLink = await screen.findByShadowText("Dashboard");
    const salesLink = await screen.findByShadowText("Sales");

    expect(dashboardLink).toBeInTheDocument();
    expect(salesLink).toBeInTheDocument();
  });

  test("theme switcher is present", async () => {
    const themeButton = await screen.findByShadowRole("combobox", { name: /choose theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  describe("user menu - anonymous user", () => {
    beforeEach(async () => {
      // isAnonymous defaults to false, so we need to set it to true for anonymous tests
      element.isAnonymous = true;
      await element.updateComplete;
    });

    test("avatar button renders inside a wa-dropdown", () => {
      const dropdown = element.shadowRoot!.querySelector("wa-dropdown");
      expect(dropdown).toBeTruthy();

      const avatarButton = dropdown!.querySelector("wa-button.avatar-button");
      expect(avatarButton).toBeTruthy();
    });

    test('dropdown shows "Sign In" option for anonymous users', () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));
      expect(signInItem).toBeTruthy();
    });

    test('dropdown does not show "Sign Out" option for anonymous users', () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signOutItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign Out"));
      expect(signOutItem).toBeFalsy();
    });

    test('clicking "Sign In" opens the auth dialog in sign-in mode', async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));

      signInItem!.click();
      await element.updateComplete;

      const dialog = element.shadowRoot!.querySelector("wa-dialog");
      expect(dialog).toBeTruthy();
      expect(dialog!.hasAttribute("open")).toBe(true);
      expect(dialog!.getAttribute("label")).toBe("Sign In");
    });

    test("sign-in dialog shows email and password fields", async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));
      signInItem!.click();
      await element.updateComplete;

      const inputs = element.shadowRoot!.querySelectorAll("wa-dialog wa-input");
      const labels = Array.from(inputs).map((input) => input.getAttribute("label"));

      expect(labels).toContain("Email");
      expect(labels).toContain("Password");
    });

    test("sign-in dialog does NOT show name or confirm password fields", async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));
      signInItem!.click();
      await element.updateComplete;

      const inputs = element.shadowRoot!.querySelectorAll("wa-dialog wa-input");
      const labels = Array.from(inputs).map((input) => input.getAttribute("label"));

      expect(labels).not.toContain("Name");
      expect(labels).not.toContain("Confirm Password");
    });

    test('submit button says "Sign in" in sign-in mode', async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));
      signInItem!.click();
      await element.updateComplete;

      const footerButtons = element.shadowRoot!.querySelectorAll('wa-dialog wa-button[slot="footer"]');
      const submitButton = Array.from(footerButtons).find((btn) => btn.getAttribute("variant") === "brand");
      expect(submitButton?.textContent?.trim()).toBe("Sign in");
    });

    test('clicking "Sign up" link switches to sign-up mode', async () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));
      signInItem!.click();
      await element.updateComplete;

      const toggleLink = element.shadowRoot!.querySelector(".auth-toggle a");
      expect(toggleLink?.textContent?.trim()).toBe("Sign up");

      (toggleLink as HTMLElement).click();
      await element.updateComplete;

      const dialog = element.shadowRoot!.querySelector("wa-dialog");
      expect(dialog!.getAttribute("label")).toBe("Sign Up");
    });

    test("sign-up mode shows name, email, password, and confirm password fields", async () => {
      // Open dialog and switch to sign-up
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));
      signInItem!.click();
      await element.updateComplete;

      const toggleLink = element.shadowRoot!.querySelector(".auth-toggle a");
      (toggleLink as HTMLElement).click();
      await element.updateComplete;

      const inputs = element.shadowRoot!.querySelectorAll("wa-dialog wa-input");
      const labels = Array.from(inputs).map((input) => input.getAttribute("label"));

      expect(labels).toContain("Name");
      expect(labels).toContain("Email");
      expect(labels).toContain("Password");
      expect(labels).toContain("Confirm Password");
    });

    test('submit button says "Sign up" in sign-up mode', async () => {
      // Open dialog and switch to sign-up
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));
      signInItem!.click();
      await element.updateComplete;

      const toggleLink = element.shadowRoot!.querySelector(".auth-toggle a");
      (toggleLink as HTMLElement).click();
      await element.updateComplete;

      const footerButtons = element.shadowRoot!.querySelectorAll('wa-dialog wa-button[slot="footer"]');
      const submitButton = Array.from(footerButtons).find((btn) => btn.getAttribute("variant") === "brand");
      expect(submitButton?.textContent?.trim()).toBe("Sign up");
    });

    test('clicking "Sign in" link in sign-up mode switches back to sign-in mode', async () => {
      // Open dialog and switch to sign-up
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));
      signInItem!.click();
      await element.updateComplete;

      let toggleLink = element.shadowRoot!.querySelector(".auth-toggle a");
      (toggleLink as HTMLElement).click();
      await element.updateComplete;

      // Now switch back to sign-in
      toggleLink = element.shadowRoot!.querySelector(".auth-toggle a");
      expect(toggleLink?.textContent?.trim()).toBe("Sign in");

      (toggleLink as HTMLElement).click();
      await element.updateComplete;

      const dialog = element.shadowRoot!.querySelector("wa-dialog");
      expect(dialog!.getAttribute("label")).toBe("Sign In");
    });
  });

  describe("inventory navigation", () => {
    test("does not show inventory links for non-employee/admin users", async () => {
      element.userRole = "user";
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll("a");
      const inventoryLinks = Array.from(links).filter(
        (a) => a.href.includes("/inventory/singles") || a.href.includes("/inventory/sealed"),
      );
      expect(inventoryLinks.length).toBe(0);
    });

    test("shows inventory section with Singles and Sealed links for employee role", async () => {
      element.userRole = "employee";
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll("a");
      const inventorySinglesLink = Array.from(links).find((a) => a.getAttribute("href") === "/inventory/singles");
      const inventorySealedLink = Array.from(links).find((a) => a.getAttribute("href") === "/inventory/sealed");

      expect(inventorySinglesLink).toBeTruthy();
      expect(inventorySealedLink).toBeTruthy();
      expect(inventorySinglesLink!.textContent?.trim()).toBe("Singles");
      expect(inventorySealedLink!.textContent?.trim()).toBe("Sealed");
    });

    test("shows inventory section with Singles and Sealed links for admin role", async () => {
      element.userRole = "admin";
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll("a");
      const inventorySinglesLink = Array.from(links).find((a) => a.getAttribute("href") === "/inventory/singles");
      const inventorySealedLink = Array.from(links).find((a) => a.getAttribute("href") === "/inventory/sealed");

      expect(inventorySinglesLink).toBeTruthy();
      expect(inventorySealedLink).toBeTruthy();
    });

    test("highlights Singles link when activePage is inventory/singles", async () => {
      element.userRole = "employee";
      element.activePage = "inventory/singles";
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll("a");
      const singlesLink = Array.from(links).find((a) => a.getAttribute("href") === "/inventory/singles");
      expect(singlesLink?.hasAttribute("current")).toBe(true);
    });

    test("highlights Sealed link when activePage is inventory/sealed", async () => {
      element.userRole = "employee";
      element.activePage = "inventory/sealed";
      await element.updateComplete;

      const links = element.shadowRoot!.querySelectorAll("a");
      const sealedLink = Array.from(links).find((a) => a.getAttribute("href") === "/inventory/sealed");
      expect(sealedLink?.hasAttribute("current")).toBe(true);
    });
  });

  describe("user menu - authenticated user", () => {
    beforeEach(async () => {
      element.isAnonymous = false;
      element.userName = "Test User";
      await element.updateComplete;
    });

    test("dropdown shows user name", () => {
      const userLabel = element.shadowRoot!.querySelector(".dropdown-user-label");
      expect(userLabel).toBeTruthy();
      expect(userLabel!.textContent?.trim()).toBe("Test User");
    });

    test('dropdown shows "Sign Out" option', () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signOutItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign Out"));
      expect(signOutItem).toBeTruthy();
    });

    test('dropdown does not show "Sign In" option', () => {
      const dropdownItems = element.shadowRoot!.querySelectorAll("wa-dropdown-item");
      const signInItem = Array.from(dropdownItems).find((item) => item.textContent?.trim().includes("Sign In"));
      expect(signInItem).toBeFalsy();
    });
  });
});
