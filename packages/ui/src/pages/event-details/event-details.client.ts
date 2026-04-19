import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import { execute } from '../../lib/graphql.ts';
import { graphql } from '../../graphql/index.ts';
import { formatEventType, formatEntryFee, formatTime, formatFullDate } from '../../lib/event-helpers.ts';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';

// --- Types ---

interface EventDetail {
  id: number;
  name: string;
  description: string | null;
  eventType: string;
  gameName: string | null;
  gameDisplayName: string | null;
  startTime: string;
  endTime: string | null;
  capacity: number | null;
  entryFeeInCents: number | null;
  status: string;
  registrationCount: number;
}

// --- GraphQL ---

const GetPublicEventQuery = graphql(`
  query GetPublicEvent($id: Int!) {
    getPublicEvent(id: $id) {
      id
      name
      description
      eventType
      gameName
      gameDisplayName
      startTime
      endTime
      capacity
      entryFeeInCents
      status
      registrationCount
    }
  }
`);

const RegisterForEventMutation = graphql(`
  mutation RegisterForEventDetail($eventId: Int!, $input: PublicEventRegistrationInput!) {
    registerForEvent(eventId: $eventId, input: $input) {
      id
      registrantName
      status
    }
  }
`);

// --- Component ---

@customElement('ogs-event-details-page')
export class EventDetailsPage extends OgsPageBase {
  @property({ type: Boolean }) showStoreSelector = false;
  @property() eventId = '';

  // --- Page state ---
  @state() event: EventDetail | null = null;
  @state() loading = true;
  @state() error = '';
  @state() showRegistration = false;
  @state() registrationName = '';
  @state() registrationEmail = '';
  @state() registrationPhone = '';
  @state() registrationSuccess = false;
  @state() registrationError = '';
  @state() registering = false;

  static styles = [
    css`
      ${unsafeCSS(nativeStyle)}
    `,
    css`
      ${unsafeCSS(utilityStyles)}
    `,
    css`
      :host {
        box-sizing: border-box;
        display: block;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      /* --- Back link --- */

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        margin-bottom: 1.5rem;
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
        text-decoration: none;
        cursor: pointer;
        transition: color 0.15s ease;
      }

      .back-link:hover {
        color: var(--wa-color-text-normal);
      }

      /* --- Loading / Error --- */

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        gap: 1rem;
      }

      .loading-container span {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-s);
      }

      .not-found {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 4rem 2rem;
        color: var(--wa-color-text-muted);
        background: var(--wa-color-surface-raised);
        border: 2px dashed var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
      }

      .not-found wa-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .not-found h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-text-normal);
      }

      .not-found p {
        margin: 0 0 1.5rem 0;
        max-width: 400px;
      }

      /* --- Event Detail Card --- */

      .event-detail {
        max-width: 720px;
      }

      .event-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .event-title {
        font-size: var(--wa-font-size-2xl);
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.01em;
      }

      .event-badges {
        display: flex;
        gap: 0.375rem;
        align-items: center;
        flex-shrink: 0;
      }

      /* --- Meta grid --- */

      .event-meta {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
        padding: 1.25rem;
        background: var(--wa-color-surface-sunken);
        border-radius: var(--wa-border-radius-l);
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: var(--wa-font-size-s);
      }

      .meta-item wa-icon {
        font-size: 1.125rem;
        color: var(--wa-color-text-muted);
        flex-shrink: 0;
      }

      .meta-label {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-xs);
      }

      .meta-value {
        font-weight: 600;
      }

      /* --- Description --- */

      .event-description {
        margin: 1.5rem 0;
        font-size: var(--wa-font-size-m);
        line-height: 1.7;
        color: var(--wa-color-text-normal);
      }

      /* --- Capacity --- */

      .capacity-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: var(--wa-font-size-s);
        padding: 0.75rem 1rem;
        background: var(--wa-color-surface-sunken);
        border-radius: var(--wa-border-radius-m);
      }

      .capacity-info.full {
        background: var(--wa-color-danger-container);
        color: var(--wa-color-danger-text);
      }

      /* --- Registration Form --- */

      .registration-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1.5rem;
        padding: 1.5rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
      }

      .registration-form h3 {
        margin: 0;
        font-size: var(--wa-font-size-l);
        font-weight: 600;
      }

      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.fetchEvent();
  }

  private async fetchEvent() {
    if (!this.eventId) {
      this.loading = false;
      this.error = 'No event ID provided.';
      return;
    }

    const id = Number(this.eventId);
    if (Number.isNaN(id)) {
      this.loading = false;
      this.error = 'Invalid event ID.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const result = await execute(GetPublicEventQuery, {
        id,
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.event = (result.data.getPublicEvent as EventDetail) ?? null;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load event';
    } finally {
      this.loading = false;
    }
  }

  private isEventFull(): boolean {
    if (!this.event) return false;
    return this.event.capacity != null && this.event.registrationCount >= this.event.capacity;
  }

  private openRegistrationForm() {
    this.showRegistration = true;
    this.registrationSuccess = false;
    this.registrationError = '';
  }

  private handleNameInput(e: Event) {
    this.registrationName = (e.target as WaInput).value as string;
  }

  private handleEmailInput(e: Event) {
    this.registrationEmail = (e.target as WaInput).value as string;
  }

  private handlePhoneInput(e: Event) {
    this.registrationPhone = (e.target as WaInput).value as string;
  }

  private async handleRegister(e: Event) {
    e.preventDefault();

    if (!this.registrationName.trim()) {
      this.registrationError = 'Name is required.';
      return;
    }

    if (!this.event) return;

    this.registering = true;
    this.registrationError = '';

    try {
      const result = await execute(RegisterForEventMutation, {
        eventId: this.event.id,
        input: {
          registrantName: this.registrationName.trim(),
          ...(this.registrationEmail.trim() ? { registrantEmail: this.registrationEmail.trim() } : {}),
          ...(this.registrationPhone.trim() ? { registrantPhone: this.registrationPhone.trim() } : {}),
        },
      });

      if (result?.errors?.length) {
        this.registrationError = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.registrationSuccess = true;
        this.showRegistration = false;
        // Update registration count locally
        if (this.event) {
          this.event = { ...this.event, registrationCount: this.event.registrationCount + 1 };
        }
      }
    } catch (e) {
      this.registrationError = e instanceof Error ? e.message : 'Registration failed';
    } finally {
      this.registering = false;
    }
  }

  render() {
    return this.renderPage(
      html`
        <a class="back-link" href="/events">
          <wa-icon name="arrow-left" style="font-size: 0.875rem;"></wa-icon>
          Back to events
        </a>

        ${when(
          this.error && !this.event,
          () => html`
            <wa-callout variant="danger" style="margin-bottom: 1rem;">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.error}
            </wa-callout>
          `,
        )}
        ${when(
          this.loading,
          () => html`
            <div class="loading-container">
              <wa-spinner style="font-size: 2rem;"></wa-spinner>
              <span>Loading event...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
      `,
      {
        activePage: 'events',
        showUserMenu: true,
        showStoreSelector: this.showStoreSelector,
      },
    );
  }

  private renderContent() {
    if (!this.event) {
      return html`
        <div class="not-found">
          <wa-icon name="calendar-xmark"></wa-icon>
          <h3>Event Not Found</h3>
          <p>This event may have been cancelled or doesn't exist.</p>
          <wa-button variant="brand" href="/events">Browse Events</wa-button>
        </div>
      `;
    }

    const event = this.event;
    const isFull = this.isEventFull();

    return html`
      <div class="event-detail">
        <div class="event-header">
          <h1 class="event-title">${event.name}</h1>
          <div class="event-badges">
            <wa-badge variant="neutral">${formatEventType(event.eventType)}</wa-badge>
            ${isFull ? html`<wa-badge variant="danger">Full</wa-badge>` : nothing}
          </div>
        </div>

        <div class="event-meta">
          <div class="meta-item">
            <wa-icon name="calendar"></wa-icon>
            <div>
              <div class="meta-label">Date</div>
              <div class="meta-value">${formatFullDate(event.startTime)}</div>
            </div>
          </div>
          <div class="meta-item">
            <wa-icon name="clock"></wa-icon>
            <div>
              <div class="meta-label">Time</div>
              <div class="meta-value">
                ${formatTime(event.startTime)}${event.endTime ? html` &ndash; ${formatTime(event.endTime)}` : nothing}
              </div>
            </div>
          </div>
          ${event.gameDisplayName
            ? html`
                <div class="meta-item">
                  <wa-icon name="dice"></wa-icon>
                  <div>
                    <div class="meta-label">Game</div>
                    <div class="meta-value">${event.gameDisplayName}</div>
                  </div>
                </div>
              `
            : nothing}
          <div class="meta-item">
            <wa-icon name="dollar-sign"></wa-icon>
            <div>
              <div class="meta-label">Entry Fee</div>
              <div class="meta-value">${formatEntryFee(event.entryFeeInCents)}</div>
            </div>
          </div>
          <div class="meta-item">
            <wa-icon name="users"></wa-icon>
            <div>
              <div class="meta-label">Registered</div>
              <div class="meta-value">
                ${event.capacity != null
                  ? html`${event.registrationCount} / ${event.capacity}`
                  : html`${event.registrationCount}`}
              </div>
            </div>
          </div>
        </div>

        ${event.description ? html`<div class="event-description">${event.description}</div>` : nothing}

        <wa-divider></wa-divider>

        ${event.capacity != null
          ? html`
              <div class="capacity-info ${isFull ? 'full' : ''}" style="margin-top: 1rem;">
                <wa-icon name="${isFull ? 'circle-xmark' : 'circle-check'}" style="font-size: 1rem;"></wa-icon>
                ${isFull
                  ? 'This event is full. Registration is closed.'
                  : `${event.capacity - event.registrationCount} spot${event.capacity - event.registrationCount !== 1 ? 's' : ''} remaining`}
              </div>
            `
          : nothing}
        ${when(
          this.registrationSuccess,
          () => html`
            <wa-callout variant="success" style="margin-top: 1rem;">
              <wa-icon slot="icon" name="circle-check"></wa-icon>
              You have been successfully registered for this event!
            </wa-callout>
          `,
        )}
        ${when(
          !this.registrationSuccess && !this.showRegistration && !isFull,
          () => html`
            <wa-button variant="brand" style="margin-top: 1.5rem;" @click="${this.openRegistrationForm}">
              <wa-icon slot="start" name="pen-to-square"></wa-icon>
              Register for Event
            </wa-button>
          `,
        )}
        ${when(this.showRegistration, () => this.renderRegistrationForm())}
      </div>
    `;
  }

  private renderRegistrationForm() {
    return html`
      <div class="registration-form">
        <h3>Register for Event</h3>
        ${when(
          this.registrationError,
          () => html`
            <wa-callout variant="danger">
              <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
              ${this.registrationError}
            </wa-callout>
          `,
        )}
        <form @submit="${this.handleRegister}">
          <div class="form-fields">
            <wa-input
              label="Name"
              placeholder="Your name"
              required
              .value="${this.registrationName}"
              @input="${this.handleNameInput}"
            ></wa-input>
            <wa-input
              label="Email"
              type="email"
              placeholder="Email address (optional)"
              .value="${this.registrationEmail}"
              @input="${this.handleEmailInput}"
            ></wa-input>
            <wa-input
              label="Phone"
              type="tel"
              placeholder="Phone number (optional)"
              .value="${this.registrationPhone}"
              @input="${this.handlePhoneInput}"
            ></wa-input>
          </div>
          <div class="form-actions" style="margin-top: 1rem;">
            <wa-button variant="brand" type="submit" ?loading="${this.registering}" ?disabled="${this.registering}">
              <wa-icon slot="start" name="check"></wa-icon>
              Register
            </wa-button>
            <wa-button
              variant="neutral"
              appearance="text"
              @click="${() => {
                this.showRegistration = false;
                this.registrationError = '';
              }}"
            >
              Cancel
            </wa-button>
          </div>
        </form>
      </div>
    `;
  }
}
