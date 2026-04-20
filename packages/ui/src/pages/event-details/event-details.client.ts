import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import { execute } from '../../lib/graphql.ts';
import { graphql } from '../../graphql/index.ts';
import { formatEventType, formatEntryFee, formatTime, formatFullDate } from '../../lib/event-helpers.ts';
import { storeUrl } from '../../lib/store-url';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';

// --- Types ---

interface EventRegistrationDetail {
  registrantName: string;
}

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
  registrations: EventRegistrationDetail[] | null;
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
      registrations {
        registrantName
      }
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
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      /* --- Breadcrumb --- */

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        font-size: var(--wa-font-size-m);
        color: var(--wa-color-text-muted);
      }

      .breadcrumb a {
        color: var(--wa-color-text-link);
        text-decoration: none;
      }

      .breadcrumb a:hover {
        text-decoration: underline;
      }

      .breadcrumb wa-icon {
        font-size: 0.75rem;
      }

      /* --- Page Header --- */

      .page-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .page-header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: var(--wa-border-radius-l);
        background: var(--wa-color-brand-fill-normal);
        color: var(--wa-color-brand-on-normal);
        flex-shrink: 0;
      }

      .page-header-content {
        flex: 1;
      }

      .page-header h2 {
        margin: 0;
        font-size: var(--wa-font-size-2xl);
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .page-header p {
        margin: 0.25rem 0 0 0;
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-m);
      }

      .page-header-badges {
        display: flex;
        gap: 0.375rem;
        align-items: center;
        flex-shrink: 0;
      }

      /* --- Section Header --- */

      .section-header {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-size: var(--wa-font-size-l);
        font-weight: 700;
      }

      .section-header wa-icon {
        color: var(--wa-color-brand-60);
        font-size: 1.125rem;
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
        font-size: var(--wa-font-size-m);
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

      /* --- Meta grid --- */

      .event-meta {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: var(--wa-font-size-m);
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
        font-size: var(--wa-font-size-m);
        line-height: 1.7;
        color: var(--wa-color-text-normal);
        white-space: pre-line;
      }

      /* --- Registration Bar --- */

      .registration-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .capacity-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: var(--wa-font-size-m);
        padding: 0.75rem 1rem;
        background: var(--wa-color-surface-sunken);
        border-radius: var(--wa-border-radius-m);
        margin-bottom: 1rem;
      }

      .capacity-info.full {
        color: var(--wa-color-danger-text);
      }

      /* --- Registration Form --- */

      .form-fields {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-top: 1rem;
      }

      /* --- Attendees List --- */

      .attendees-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.5rem;
      }

      .attendee-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.5rem 0.75rem;
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-surface-sunken);
        font-size: var(--wa-font-size-m);
      }

      .attendee-item wa-icon {
        color: var(--wa-color-text-muted);
        font-size: 1rem;
        flex-shrink: 0;
      }

      .attendees-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 2rem 1rem;
        color: var(--wa-color-text-muted);
      }

      .attendees-empty wa-icon {
        font-size: 2.5rem;
        margin-bottom: 0.75rem;
        opacity: 0.4;
      }

      .attendees-empty p {
        margin: 0;
        font-size: var(--wa-font-size-m);
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
        // Update registration count and attendees list locally
        if (this.event) {
          const currentRegistrations = this.event.registrations ?? [];
          this.event = {
            ...this.event,
            registrationCount: this.event.registrationCount + 1,
            registrations: [...currentRegistrations, { registrantName: this.registrationName.trim() }],
          };
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
    if (this.error) {
      return html`
        <wa-callout variant="danger">
          <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
          ${this.error}
        </wa-callout>
      `;
    }

    if (!this.event) {
      return html`
        <div class="not-found">
          <wa-icon name="calendar-xmark"></wa-icon>
          <h3>Event Not Found</h3>
          <p>This event may have been cancelled or doesn't exist.</p>
          <wa-button variant="brand" href="${storeUrl('/events')}">Browse Events</wa-button>
        </div>
      `;
    }

    const event = this.event;
    const isFull = this.isEventFull();
    const subtitle = [event.gameDisplayName, formatFullDate(event.startTime)].filter(Boolean).join(' / ');

    return html`
      <div class="breadcrumb">
        <a href="${storeUrl('/events')}">Events</a>
        <wa-icon name="chevron-right"></wa-icon>
        <span>${event.name}</span>
      </div>

      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="calendar" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>${event.name}</h2>
          <p>${subtitle}</p>
        </div>
        <div class="page-header-badges">
          <wa-badge variant="neutral">${formatEventType(event.eventType)}</wa-badge>
          ${isFull ? html`<wa-badge variant="danger">Full</wa-badge>` : nothing}
        </div>
      </div>

      <div class="wa-stack">
        <wa-card appearance="outlined">
          <div slot="header" class="section-header">
            <wa-icon name="circle-info"></wa-icon>
            <span>Event Details</span>
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
          ${event.description
            ? html`
                <wa-divider></wa-divider>
                <div class="event-description">${event.description}</div>
              `
            : nothing}
        </wa-card>

        <wa-card appearance="outlined">
          <div slot="header" class="section-header">
            <wa-icon name="users"></wa-icon>
            <span>Registered Attendees</span>
          </div>
          ${when(
            this.registrationSuccess,
            () => html`
              <wa-callout variant="success">
                <wa-icon slot="icon" name="circle-check"></wa-icon>
                You have been successfully registered for this event!
              </wa-callout>
            `,
            () => html`
              <div class="registration-bar">
                ${event.capacity != null
                  ? html`
                      <div class="capacity-info ${isFull ? 'full' : ''}">
                        <wa-icon name="${isFull ? 'circle-xmark' : 'circle-check'}"></wa-icon>
                        ${isFull
                          ? 'This event is full. Registration is closed.'
                          : `${event.capacity - event.registrationCount} spot${event.capacity - event.registrationCount !== 1 ? 's' : ''} remaining`}
                      </div>
                    `
                  : nothing}
                ${when(
                  !this.showRegistration && !isFull,
                  () => html`
                    <wa-button variant="brand" @click="${this.openRegistrationForm}">
                      <wa-icon slot="start" name="pen-to-square"></wa-icon>
                      Register for Event
                    </wa-button>
                  `,
                )}
              </div>
              ${when(this.showRegistration, () => this.renderRegistrationForm())}
            `,
          )}
          ${when(
            event.registrations && event.registrations.length > 0,
            () => html`
              <wa-divider></wa-divider>
              <div class="attendees-list">
                ${event.registrations!.map(
                  (reg) => html`
                    <div class="attendee-item">
                      <wa-icon name="user"></wa-icon>
                      <span>${reg.registrantName}</span>
                    </div>
                  `,
                )}
              </div>
            `,
            () => html`
              <wa-divider></wa-divider>
              <div class="attendees-empty">
                <wa-icon name="users"></wa-icon>
                <p>No one has registered yet. Be the first!</p>
              </div>
            `,
          )}
        </wa-card>
      </div>
    `;
  }

  private renderRegistrationForm() {
    return html`
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
        <div class="form-actions">
          <wa-button variant="brand" type="submit" ?loading="${this.registering}" ?disabled="${this.registering}">
            <wa-icon slot="start" name="check"></wa-icon>
            Register
          </wa-button>
          <wa-button
            variant="neutral"
            appearance="plain"
            @click="${() => {
              this.showRegistration = false;
              this.registrationError = '';
            }}"
          >
            Cancel
          </wa-button>
        </div>
      </form>
    `;
  }
}
