import { LitElement, PropertyValues, css, html, nothing, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import utilityStyles from "@awesome.me/webawesome/dist/styles/utilities.css?inline";
import "@awesome.me/webawesome/dist/components/select/select.js";
import "@awesome.me/webawesome/dist/components/option/option.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "@awesome.me/webawesome/dist/components/avatar/avatar.js";
import WaSelect from "@awesome.me/webawesome/dist/components/select/select.js";

// These components reference `document` at module scope, so they must be
// loaded dynamically to avoid "document is not defined" during SSR.
if (typeof globalThis.document !== "undefined") {
  import("@awesome.me/webawesome/dist/components/dropdown/dropdown.js");
  import("@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js");
  import("@awesome.me/webawesome/dist/components/dialog/dialog.js");
  import("@awesome.me/webawesome/dist/components/input/input.js");
}
import Cookies from "js-cookie";
import { graphql } from "../graphql";
import { execute } from "../lib/graphql";
import { ShoppingCart } from "../graphql/graphql";

// Lazy-load authClient to avoid potential SSR issues
let _authClient: typeof import("../auth-client").authClient | undefined;
async function getAuthClient() {
  if (!_authClient) {
    const mod = await import("../auth-client");
    _authClient = mod.authClient;
  }
  return _authClient;
}

@customElement("ogs-page")
export class OgsPage extends LitElement {
  static styles = [
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    css`
      :host {
        display: block;
        box-sizing: border-box;
      }

      :root {
        height: 100%;
      }

      #page {
        display: flex;
        height: calc(100% - 84px);
      }

      header {
        box-sizing: border-box;
        border-bottom: var(--wa-border-style) var(--wa-panel-border-width) var(--wa-color-surface-border);
        padding-inline: var(--wa-space-xl);
        padding-inline-end: var(--wa-space-s);
        block-size: 84px;
      }

      nav {
        display: flex;
        flex-direction: column;
        column-gap: 1rem;
        overflow: auto;
        height: 100%;
        max-height: 100%;
        min-width: 300px;
        max-width: 300px;
        box-sizing: border-box;
        border-right: var(--wa-border-style) var(--wa-panel-border-width) var(--wa-color-surface-border);
        overflow-x: auto;
        overflow-y: auto;
      }

      ul {
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin: 0;
        padding: 0;
      }

      li {
        padding: 1rem 2rem;
        list-style: none;
      }

      a {
        color: var(--wa-color-text-link);
        text-decoration: none;
      }

      a[current] {
        text-decoration: underline;
      }

      section {
        box-sizing: border-box;
        margin-inline: auto;
        max-width: 1200px;
        flex: 1;
      }

      [hidden] {
        display: none;
      }

      wa-button.avatar-button::part(base) {
        border-radius: 100%;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: var(--wa-space-m);
      }

      .auth-error {
        color: var(--wa-color-danger-text);
        margin: 0;
        font-size: var(--wa-font-size-s);
      }

      .auth-toggle {
        margin-top: var(--wa-space-m);
        text-align: center;
        font-size: var(--wa-font-size-s);
      }

      .auth-toggle a {
        color: var(--wa-color-text-link);
        cursor: pointer;
        text-decoration: underline;
      }

      .dropdown-user-label {
        padding: var(--wa-space-xs) var(--wa-space-m);
        font-weight: bold;
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-normal);
      }
    `,
  ];

  @property({ type: String })
  activePage?: string;

  @property({ type: String })
  userRole = "";

  @property({ type: Boolean })
  hideNav = false;

  @property({ type: Boolean })
  isAnonymous = false;

  @property({ type: String })
  userName = "";

  @state()
  themePreference = Cookies.get("ogs-theme-preference") || "auto";

  @state()
  themeColor = this.determineThemeColor();

  @state()
  cart?: ShoppingCart;

  @state()
  showAuthDialog = false;

  @state()
  authMode: "signin" | "signup" = "signin";

  @state()
  authEmail = "";

  @state()
  authPassword = "";

  @state()
  authConfirmPassword = "";

  @state()
  authName = "";

  @state()
  authError = "";

  @state()
  authLoading = false;

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.updateThemeClass();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.fetchCart();
  }

  async fetchCart() {
    const GetShoppingCartQuery = graphql(`
      query GetShoppingCartQuery {
        getShoppingCart {
          items {
            quantity
            productId
            productName
          }
        }
      }
    `);

    const result = await execute(GetShoppingCartQuery);

    if (result?.errors?.length) {
      console.log({ result });
    } else {
      this.cart = result.data.getShoppingCart;
    }
  }

  render() {
    return html`
      <header class="wa-split">
        <h1>OpenTCGS</h1>
        <div class="wa-cluster">
          <wa-select
            class="color-scheme-selector"
            appearance="filled"
            value="${this.themePreference}"
            title="Press  to toggle"
            placement="bottom"
            @change="${this.handleThemePreferenceChange}"
          >
            <span slot="label" class="wa-visually-hidden">Choose Theme</span>
            <wa-icon
              class="only-light"
              slot="start"
              name="sun"
              variant="regular"
              .hidden="${this.themeColor === "dark"}"
            ></wa-icon>
            <wa-icon
              class="only-dark"
              slot="start"
              name="moon"
              variant="regular"
              .hidden="${this.themeColor === "light"}"
            ></wa-icon>
            <wa-option value="light">
              <wa-icon slot="start" name="sun" variant="regular"></wa-icon>
              Light
            </wa-option>
            <wa-option value="dark">
              <wa-icon slot="start" name="moon" variant="regular"></wa-icon>
              Dark
            </wa-option>
            <wa-divider role="separator" aria-orientation="horizontal" orientation="horizontal"></wa-divider>
            <wa-option value="auto">
              <wa-icon class="only-light" slot="start" name="sun" variant="regular"></wa-icon>
              <wa-icon class="only-dark" slot="start" name="moon" variant="regular"></wa-icon>
              System
            </wa-option>
          </wa-select>
          <wa-button appearance="filled" aria-label="Shopping cart">
            <wa-icon name="shopping-cart" label="Shopping cart"></wa-icon>
            <wa-badge pill
              >${this.cart?.items.reduce<number>((total, item) => (total += item.quantity), 0) ?? 0}</wa-badge
            >
          </wa-button>
          <wa-divider orientation="vertical"></wa-divider>
          ${this.renderUserMenu()}
        </div>
      </header>
      <div id="page">
        ${when(
          !this.hideNav,
          () => html`
            <nav>
              <h2>${this.renderAnchor("/", "Dashboard", "Dashboard")}</h2>
              <h2>Cards</h2>
              <ul>
                <li>${this.renderAnchor("/games/magic/cards", "Magic", "games/magic/cards")}</li>
                <li>${this.renderAnchor("/games/pokemon/cards", "Pokemon", "games/pokemon/cards")}</li>
              </ul>
              <h2>${this.renderAnchor("/sales", "Sales", "Sales")}</h2>
              ${when(
                this.userRole === "admin" || this.userRole === "employee",
                () => html`
                  <h2>Inventory</h2>
                  <ul>
                    <li>${this.renderAnchor("/inventory/singles", "Singles", "inventory/singles")}</li>
                    <li>${this.renderAnchor("/inventory/sealed", "Sealed", "inventory/sealed")}</li>
                  </ul>
                `,
              )}
            </nav>
          `,
          () => nothing,
        )}
        <section>
          <slot></slot>
        </section>
      </div>
      ${this.renderAuthDialog()}
    `;
  }

  private renderUserMenu() {
    if (this.isAnonymous) {
      return html`
        <wa-dropdown>
          <wa-button class="avatar-button" appearance="filled" slot="trigger" aria-label="User menu">
            <wa-icon name="user" variant="solid" label="User"></wa-icon>
          </wa-button>
          <wa-dropdown-item @click="${this.openAuthDialog}">
            <wa-icon slot="icon" name="sign-in"></wa-icon>
            Sign In
          </wa-dropdown-item>
        </wa-dropdown>
      `;
    }

    return html`
      <wa-dropdown>
        <wa-button class="avatar-button" appearance="filled" slot="trigger" aria-label="User menu">
          <wa-icon name="user" variant="solid" label="User"></wa-icon>
        </wa-button>
        <div class="dropdown-user-label">${this.userName}</div>
        <wa-divider></wa-divider>
        <wa-dropdown-item @click="${this.handleSignOut}">
          <wa-icon slot="icon" name="sign-out"></wa-icon>
          Sign Out
        </wa-dropdown-item>
      </wa-dropdown>
    `;
  }

  private renderAuthDialog() {
    return html`
      <wa-dialog
        label="${this.authMode === "signin" ? "Sign In" : "Sign Up"}"
        ?open="${this.showAuthDialog}"
        @wa-after-hide="${this.closeAuthDialog}"
      >
        <div class="auth-form" @keydown="${this.handleAuthKeydown}">
          ${when(
            this.authMode === "signup",
            () => html`
              <wa-input
                label="Name"
                name="name"
                autocomplete="name"
                required
                .value="${this.authName}"
                @input="${this.handleAuthNameInput}"
              >
                <wa-icon slot="start" name="user"></wa-icon>
                <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
              </wa-input>
            `,
          )}

          <wa-input
            type="email"
            name="email"
            autocomplete="email"
            label="Email"
            required
            .value="${this.authEmail}"
            @input="${this.handleAuthEmailInput}"
          >
            <wa-icon slot="start" name="envelope"></wa-icon>
            <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
          </wa-input>

          <wa-input
            type="password"
            name="password"
            autocomplete="${this.authMode === "signin" ? "current-password" : "new-password"}"
            label="Password"
            required
            password-toggle
            .value="${this.authPassword}"
            @input="${this.handleAuthPasswordInput}"
          >
            <wa-icon slot="start" name="lock"></wa-icon>
            <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
          </wa-input>

          ${when(
            this.authMode === "signup",
            () => html`
              <wa-input
                type="password"
                name="confirm-password"
                autocomplete="new-password"
                label="Confirm Password"
                required
                password-toggle
                .value="${this.authConfirmPassword}"
                @input="${this.handleAuthConfirmPasswordInput}"
              >
                <wa-icon slot="start" name="lock"></wa-icon>
                <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
              </wa-input>
            `,
          )}
          ${this.authError ? html`<p class="auth-error">${this.authError}</p>` : nothing}

          <div class="auth-toggle">
            ${this.authMode === "signin"
              ? html`Don't have an account? <a @click="${this.switchToSignUp}">Sign up</a>`
              : html`Already have an account? <a @click="${this.switchToSignIn}">Sign in</a>`}
          </div>
        </div>

        <wa-button slot="footer" variant="neutral" @click="${this.closeAuthDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" ?loading="${this.authLoading}" @click="${this.handleAuthSubmit}">
          ${this.authMode === "signin" ? "Sign in" : "Sign up"}
        </wa-button>
      </wa-dialog>
    `;
  }

  private openAuthDialog() {
    this.authMode = "signin";
    this.authEmail = "";
    this.authPassword = "";
    this.authConfirmPassword = "";
    this.authName = "";
    this.authError = "";
    this.authLoading = false;
    this.showAuthDialog = true;
  }

  private closeAuthDialog() {
    this.showAuthDialog = false;
    this.authError = "";
  }

  private switchToSignUp(event: Event) {
    event.preventDefault();
    this.authMode = "signup";
    this.authError = "";
  }

  private switchToSignIn(event: Event) {
    event.preventDefault();
    this.authMode = "signin";
    this.authError = "";
  }

  private handleAuthNameInput(event: Event) {
    this.authName = (event.target as HTMLInputElement).value;
  }

  private handleAuthEmailInput(event: Event) {
    this.authEmail = (event.target as HTMLInputElement).value;
  }

  private handleAuthPasswordInput(event: Event) {
    this.authPassword = (event.target as HTMLInputElement).value;
  }

  private handleAuthConfirmPasswordInput(event: Event) {
    this.authConfirmPassword = (event.target as HTMLInputElement).value;
  }

  private handleAuthKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.handleAuthSubmit();
    }
  }

  private async handleAuthSubmit() {
    this.authError = "";
    this.authLoading = true;

    try {
      const authClient = await getAuthClient();
      if (this.authMode === "signin") {
        const result = await authClient.signIn.email({
          email: this.authEmail,
          password: this.authPassword,
        });
        if (result.error) {
          this.authError = result.error.message ?? "Sign in failed";
        } else {
          window.location.reload();
        }
      } else {
        if (this.authPassword !== this.authConfirmPassword) {
          this.authError = "Passwords do not match";
          this.authLoading = false;
          return;
        }
        const signUpResult = await authClient.signUp.email({
          email: this.authEmail,
          password: this.authPassword,
          name: this.authName,
        });
        if (signUpResult.error) {
          this.authError = signUpResult.error.message ?? "Sign up failed";
        } else {
          // Better Auth auto-signs in after sign-up by default (autoSignIn: true)
          window.location.reload();
        }
      }
    } catch (e) {
      this.authError = e instanceof Error ? e.message : "An unexpected error occurred";
    } finally {
      this.authLoading = false;
    }
  }

  private async handleSignOut() {
    try {
      const authClient = await getAuthClient();
      await authClient.signOut();
      // Clear session cookies to prevent stale session issues on next sign-in
      Cookies.remove("better-auth.session_token");
      Cookies.remove("better-auth.session_data");
      window.location.href = "/";
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  }

  handleThemePreferenceChange(event: Event) {
    const { value } = event.target as WaSelect;
    if (value && typeof value === "string") {
      Cookies.set("ogs-theme-preference", value);
      this.themePreference = value;
    }

    this.themeColor = this.determineThemeColor();
    this.updateThemeClass();
  }

  determineThemeColor() {
    if (this.themePreference === "auto") {
      const prefersDarkColorScheme = window.matchMedia("(prefers-color-scheme: dark)");
      if (prefersDarkColorScheme.matches) {
        document.querySelector("html")?.classList.add("wa-dark");
        return "dark";
      } else {
        document.querySelector("html")?.classList.remove("wa-dark");
        return "light";
      }
    }
    return this.themePreference;
  }

  updateThemeClass() {
    if (this.themeColor === "light") {
      document.querySelector("html")?.classList.remove("wa-dark");
    } else {
      document.querySelector("html")?.classList.add("wa-dark");
    }
  }

  renderAnchor(href: string, label: string, activationKey: string) {
    return html`<a href="${href}" ?current="${this.activePage === activationKey}">${label}</a>`;
  }
}
