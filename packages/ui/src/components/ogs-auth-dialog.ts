import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
  import('@awesome.me/webawesome/dist/components/input/input.js');
}

import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';

import { getAuthClient } from '../lib/auth';

@customElement('ogs-auth-dialog')
export class OgsAuthDialog extends LitElement {
  static styles = css`
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
  `;

  @property({ type: Boolean })
  open = false;

  @state()
  private authMode: 'signin' | 'signup' = 'signin';

  @state()
  private authEmail = '';

  @state()
  private authPassword = '';

  @state()
  private authConfirmPassword = '';

  @state()
  private authName = '';

  @state()
  private authError = '';

  @state()
  private authLoading = false;

  protected willUpdate(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('open') && this.open) {
      this.authMode = 'signin';
      this.authEmail = '';
      this.authPassword = '';
      this.authConfirmPassword = '';
      this.authName = '';
      this.authError = '';
      this.authLoading = false;
    }
  }

  private closeAuthDialog() {
    this.open = false;
    this.authError = '';
    this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true }));
  }

  private switchToSignUp(event: Event) {
    event.preventDefault();
    this.authMode = 'signup';
    this.authError = '';
  }

  private switchToSignIn(event: Event) {
    event.preventDefault();
    this.authMode = 'signin';
    this.authError = '';
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
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleAuthSubmit();
    }
  }

  private async handleAuthSubmit() {
    this.authError = '';
    this.authLoading = true;

    try {
      const authClient = await getAuthClient();
      if (this.authMode === 'signin') {
        const result = await authClient.signIn.email({
          email: this.authEmail,
          password: this.authPassword,
        });
        if (result.error) {
          this.authError = result.error.message ?? 'Sign in failed';
        } else {
          window.location.reload();
        }
      } else {
        if (this.authPassword !== this.authConfirmPassword) {
          this.authError = 'Passwords do not match';
          this.authLoading = false;
          return;
        }
        const signUpResult = await authClient.signUp.email({
          email: this.authEmail,
          password: this.authPassword,
          name: this.authName,
        });
        if (signUpResult.error) {
          this.authError = signUpResult.error.message ?? 'Sign up failed';
        } else {
          // Better Auth auto-signs in after sign-up by default (autoSignIn: true)
          window.location.reload();
        }
      }
    } catch (e) {
      this.authError = e instanceof Error ? e.message : 'An unexpected error occurred';
    } finally {
      this.authLoading = false;
    }
  }

  render() {
    return html`
      <wa-dialog
        label="${this.authMode === 'signin' ? 'Sign In' : 'Sign Up'}"
        ?open="${this.open}"
        @wa-after-hide="${this.closeAuthDialog}"
      >
        <div class="auth-form" @keydown="${this.handleAuthKeydown}">
          ${when(
            this.authMode === 'signup',
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
            autofocus
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
            autocomplete="${this.authMode === 'signin' ? 'current-password' : 'new-password'}"
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
            this.authMode === 'signup',
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
            ${this.authMode === 'signin'
              ? html`Don't have an account? <a @click="${this.switchToSignUp}">Sign up</a>`
              : html`Already have an account? <a @click="${this.switchToSignIn}">Sign in</a>`}
          </div>
        </div>

        <wa-button slot="footer" variant="neutral" @click="${this.closeAuthDialog}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" ?loading="${this.authLoading}" @click="${this.handleAuthSubmit}">
          ${this.authMode === 'signin' ? 'Sign in' : 'Sign up'}
        </wa-button>
      </wa-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ogs-auth-dialog': OgsAuthDialog;
  }
}
