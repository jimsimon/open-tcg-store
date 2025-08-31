import { LitElement, PropertyValues, css, html, nothing, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline'
import '@awesome.me/webawesome/dist/components/select/select.js'
import '@awesome.me/webawesome/dist/components/option/option.js'
import '@awesome.me/webawesome/dist/components/icon/icon.js'
import '@awesome.me/webawesome/dist/components/divider/divider.js'
import WaSelect from "@awesome.me/webawesome/dist/components/select/select.js";
import Cookies from 'js-cookie'

@customElement("ogs-page")
export class OgsPage extends LitElement {
  static styles = [
    css`${unsafeCSS(utilityStyles)}`,
    css`
      :host {
        display: block;
        width: 100%;
        padding: 2rem;
        box-sizing: border-box;
      }

      nav {
        width: 100%;
        border-bottom: 1px solid var(--md-sys-color-outline);
        background-color: var(--md-sys-color-surface-container);
      }

      ul {
        display: flex;
        justify-content: center;
        margin: 0;
      }

      li {
        padding: 1rem 2rem;
        list-style: none;
      }

      a {
        height: 100%;
        width: 100%;
      }

      a[current] {
        color: red;
      }

      section {
        max-width: 1200px;
        margin: 0 auto;
      }

      [hidden] {
        display: none;
      }
  `];

  @property({ type: String })
  activePage?: string;

  @property({ type: Boolean })
  hideNav = false;

  @state()
  themePreference = Cookies.get('ogs-theme-preference') || 'auto';

  @state()
  themeColor = this.determineThemeColor();

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.updateThemeClass();
  }

  render() {
    return html`
      <header class="wa-split">
        <div>OpenTCGS</div>
        <div>
          <wa-select class="color-scheme-selector" appearance="filled" size="small" value="${this.themePreference}" title="Press \ to toggle" placement="bottom" @change="${this.handleThemePreferenceChange}">
            <wa-icon class="only-light" slot="start" name="sun" variant="regular" .hidden="${this.themeColor === 'dark'}"></wa-icon>
            <wa-icon class="only-dark" slot="start" name="moon" variant="regular" .hidden="${this.themeColor === 'light'}"></wa-icon>
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
        </div>
      </header>
      ${when(
        !this.hideNav,
        () =>
          html` <nav>
            <ul>
              <li>${this.renderAnchor("/", "Dashboard")}</li>
              <li>${this.renderAnchor("/inventory", "Inventory")}</li>
              <li>${this.renderAnchor("/sales", "Sales")}</li>
              <li>${this.renderAnchor("/settings", "Settings")}</li>
            </ul>
          </nav>`,
        () => nothing,
      )}
      ${when(
        !this.hideNav,
        () => html`<slot name="side-nav"></slot>`,
        () => nothing,
      )}
      <section>
        <slot></slot>
      </section>
    `;
  }

  handleThemePreferenceChange(event: Event) {
    const { value } = event.target as WaSelect;
    if (value && typeof value === 'string') {
      Cookies.set('ogs-theme-preference', value)
      this.themePreference = value;
    }

    this.themeColor = this.determineThemeColor();
    this.updateThemeClass();
  }

  determineThemeColor() {
    if (this.themePreference === 'auto') {
      const prefersDarkColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
      if (prefersDarkColorScheme.matches) {
        document.querySelector('html')?.classList.add('wa-dark')
        return 'dark';
      } else {
        document.querySelector('html')?.classList.remove('wa-dark')
        return 'light';
      }
    }
    return this.themePreference
  }

  updateThemeClass() {
    if (this.themeColor === 'light') {
      document.querySelector('html')?.classList.remove('wa-dark')
    } else {
      document.querySelector('html')?.classList.add('wa-dark')
    }
  }

  renderAnchor(href: string, label: string) {
    return html`<a href="${href}" ?current="${this.activePage === label}"
      >${label}</a
    >`;
  }
}
