import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import "../../components/ogs-page.ts";
import "../../components/ogs-wizard.ts";
import "../../components/ogs-two-pane-panel.ts";
import "@awesome.me/webawesome/dist/components/callout/callout.js";
import "@awesome.me/webawesome/dist/components/divider/divider.js";
import "@awesome.me/webawesome/dist/components/input/input.js";
import "@awesome.me/webawesome/dist/components/icon/icon.js";
import { graphql } from "../../graphql/index.ts";
import { execute } from "../../lib/graphql.ts";

interface User {
  firstName?: string;
  email?: string;
  password?: string;
}

@customElement("ogs-first-time-setup-page")
export class FirstTimeSetupPage extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: center;
    }

    ogs-wizard {
      display: block;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-m);
    }

    wa-callout {
      margin-bottom: var(--wa-space-m);
    }
  `;

  @state()
  user: User = {
    firstName: undefined,
    email: undefined,
    password: undefined,
  };

  @state()
  error = "";

  render() {
    return html`
      <ogs-page hideNav>
        ${when(
          this.error,
          () => html`
            <wa-callout variant="danger">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.error}
            </wa-callout>
          `,
        )}
        <ogs-wizard @ogs-wizard-save-click="${this.handleSaveClick}">
          <ogs-wizard-item heading="First Time Setup">
            <p>Welcome to the first time setup wizard! This process will help you with the following tasks:</p>
            <ul>
              <li>Creating your first admin user account</li>
              <li>Configuring important system settings</li>
            </ul>
            <p>Click the "Next" button to continue through the setup process!</p>
          </ogs-wizard-item>
          <ogs-wizard-item heading="Create Admin User">
            <ogs-two-pane-panel>
              <p slot="start">
                Complete the form to create your first user account. This account will automatically be made an admin.
                Don't worry, you'll be able to add additional accounts, including more admins, after this initial setup
                process is complete.
              </p>
              <form slot="end">
                <wa-input label="First Name" name="name" autocomplete="name" @input="${this.handleFirstNameChange}">
                  <wa-icon slot="start" name="pencil"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
                <wa-input
                  type="email"
                  label="E-mail Address"
                  name="email"
                  autocomplete="email"
                  @input="${this.handleEmailChange}"
                >
                  <wa-icon slot="start" name="envelope"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
                <wa-input
                  type="password"
                  label="Password"
                  name="password"
                  autocomplete="new-password"
                  password-toggle
                  @input="${this.handlePasswordChange}"
                >
                  <wa-icon slot="start" name="lock"></wa-icon>
                  <wa-divider slot="start" orientation="vertical" style="--spacing: 0rem;"></wa-divider>
                </wa-input>
              </form>
            </ogs-two-pane-panel>
          </ogs-wizard-item>
          <ogs-wizard-item heading="Initial System Settings">
            <p>Review the following system settings and make adjustments as needed</p>
            <p>TBD</p>
          </ogs-wizard-item>
        </ogs-wizard>
      </ogs-page>
    `;
  }

  handleFirstNameChange(event: InputEvent) {
    this.user = {
      ...this.user,
      firstName: (event.target as HTMLInputElement).value,
    };
  }

  handleEmailChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.user = {
      ...this.user,
      email: input.value,
    };
    input.reportValidity();
  }

  handlePasswordChange(event: Event) {
    this.user = {
      ...this.user,
      password: (event.target as HTMLInputElement).value,
    };
  }

  async handleSaveClick() {
    // Clear any previous error
    this.error = "";

    // Client-side validation
    const missingFields: string[] = [];
    if (!this.user.firstName?.trim()) missingFields.push("First Name");
    if (!this.user.email?.trim()) missingFields.push("E-mail Address");
    if (!this.user.password) missingFields.push("Password");

    if (missingFields.length > 0) {
      this.error = `Please fill in the following required fields: ${missingFields.join(", ")}`;
      return;
    }

    const FirstTimeSetupMutation = graphql(`
      mutation FirstTimeSetupMutation($userDetails: UserDetails!, $settings: Settings!) {
        firstTimeSetup(userDetails: $userDetails, settings: $settings)
      }
    `);

    try {
      const result = await execute(FirstTimeSetupMutation, {
        userDetails: {
          firstName: this.user.firstName!,
          email: this.user.email!,
          password: this.user.password!,
        },
        settings: {
          country: "US",
          state: "MI",
        },
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(". ");
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
    }
  }
}
