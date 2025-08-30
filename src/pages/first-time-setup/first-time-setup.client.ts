import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../components/ogs-page.ts";
import "../../components/ogs-wizard.ts";
import "../../components/ogs-two-pane-panel.ts";
import '@awesome.me/webawesome/dist/components/input/input.js';
import { graphql } from "../../graphql/gql.ts";
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
      width: 50%;
    }

    form {
      display: flex;
      flex-direction: column;
    }
  `;

  @state()
  user: User = {
    firstName: undefined,
    email: undefined,
    password: undefined,
  };

  render() {
    return html`
      <ogs-wizard @ogs-wizard-save-click="${this.handleSaveClick}">
        <ogs-wizard-item>
          <h1>First Time Setup</h1>
          <p>
            Welcome to the first time setup wizard! This process will help you
            with the following tasks:
          </p>
          <ul>
            <li>Creating your first admin user account</li>
            <li>Configuring important system settings</li>
          </ul>
          <p>Click the "Next" button to continue through the setup process!</p>
        </ogs-wizard-item>
        <ogs-wizard-item>
          <h1>Create Admin User</h1>
          <ogs-two-pane-panel>
            <p slot="start">
              Complete the form to create your first user account. This account
              will automatically be made an admin. Don't worry, you'll be able
              to add additional accounts, including more admins, after this
              initial setup process is complete.
            </p>
            <form slot="end">
              <wa-input
                label="First Name"
                @input="${this.handleFirstNameChange}"
              ></wa-input>
              <wa-input
                type="email"
                label="E-mail Address"
                @input="${this.handleEmailChange}"
              ></wa-input>
              <wa-input
                type="password"
                label="Password"
                password-toggle
                @input="${this.handlePasswordChange}"
              ></wa-input>
            </form>
          </ogs-two-pane-panel>
        </ogs-wizard-item>
        <ogs-wizard-item>
          <h1>Initial system settings</h1>
          <p>
            Review the following system settings and make adjustments as needed
          </p>
          <p>TBD</p>
        </ogs-wizard-item>
      </ogs-wizard>
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
    const FirstTimeSetupMutation = graphql(`
      mutation FirstTimeSetupMutation(
        $userDetails: UserDetails!
        $settings: Settings!
      ) {
        firstTimeSetup(userDetails: $userDetails, settings: $settings)
      }
    `);

    if (this.user.email && this.user.firstName && this.user.password) {
      const result = await execute(FirstTimeSetupMutation, {
        userDetails: {
          firstName: this.user.firstName,
          email: this.user.email,
          password: this.user.password,
        },
        settings: {
          country: "US",
          state: "MI",
        },
      });

      if (result?.errors?.length) {
        console.log({ result });
      } else {
        window.location.href = '/'
      }
    }
  }
}
