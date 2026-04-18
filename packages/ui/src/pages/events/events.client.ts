import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import '../../components/ogs-event-calendar.ts';
import { execute } from '../../lib/graphql.ts';
import { graphql } from '../../graphql/index.ts';
import { activeStoreId } from '../../lib/store-context';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';

// --- Types ---

interface PublicEvent {
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

const GetPublicEventsQuery = graphql(`
  query GetPublicEvents($organizationId: String!, $dateFrom: String!, $dateTo: String!) {
    getPublicEvents(organizationId: $organizationId, dateFrom: $dateFrom, dateTo: $dateTo) {
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
  mutation RegisterForEvent($eventId: Int!, $input: PublicEventRegistrationInput!) {
    registerForEvent(eventId: $eventId, input: $input) {
      id
      registrantName
      status
    }
  }
`);

// --- Helpers ---

const EVENT_TYPE_LABELS: Record<string, string> = {
  TOURNAMENT: 'Tournament',
  CASUAL_PLAY: 'Casual Play',
  DRAFT: 'Draft',
  RELEASE_EVENT: 'Release Event',
  LEAGUE: 'League',
  PRERELEASE: 'Prerelease',
  OTHER: 'Other',
};

function formatEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEntryFee(cents: number | null): string {
  if (cents == null || cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return isoStr;
  }
}

function formatDateTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

function getMonthDateRange(year: number, month: number): { dateFrom: string; dateTo: string } {
  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    dateFrom: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-01`,
    dateTo: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
  };
}

// --- Component ---

@customElement('ogs-events-page')
export class EventsPage extends OgsPageBase {
  @property({ type: Boolean }) showStoreSelector = false;

  // --- Page state ---
  @state() events: PublicEvent[] = [];
  @state() loading = true;
  @state() selectedDate: string | null = null;
  @state() selectedEvent: PublicEvent | null = null;
  @state() showRegistration = false;
  @state() registrationName = '';
  @state() registrationEmail = '';
  @state() registrationPhone = '';
  @state() registrationSuccess = false;
  @state() registrationError = '';
  @state() registering = false;
  @state() error = '';

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
        font-size: var(--wa-font-size-s);
      }

      /* --- Layout --- */

      .events-layout {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1.5rem;
        align-items: start;
      }

      @media (max-width: 768px) {
        .events-layout {
          grid-template-columns: 1fr;
        }
      }

      /* --- Loading / Empty --- */

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

      .empty-state {
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

      .empty-state wa-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .empty-state h3 {
        margin: 0 0 0.5rem 0;
        font-size: var(--wa-font-size-xl);
        color: var(--wa-color-text-normal);
      }

      .empty-state p {
        margin: 0;
        max-width: 400px;
      }

      /* --- Event List --- */

      .events-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .events-list-header {
        font-size: var(--wa-font-size-l);
        font-weight: 700;
        margin: 0 0 0.5rem 0;
      }

      .event-card {
        cursor: pointer;
        transition: border-color 0.15s ease;
      }

      .event-card:hover {
        border-color: var(--wa-color-brand-fill-normal);
      }

      .event-card-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .event-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .event-card-title {
        font-weight: 600;
        font-size: var(--wa-font-size-m);
      }

      .event-card-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
      }

      .event-card-meta span {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      /* --- Event Detail --- */

      .event-detail {
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        padding: 1.5rem;
      }

      .event-detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .event-detail-title {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
        margin: 0;
      }

      .event-detail-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;
        font-size: var(--wa-font-size-s);
        color: var(--wa-color-text-muted);
      }

      .event-detail-meta .meta-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      .event-detail-description {
        margin: 1rem 0;
        font-size: var(--wa-font-size-s);
        line-height: 1.6;
        color: var(--wa-color-text-normal);
      }

      .back-button {
        margin-bottom: 1rem;
      }

      /* --- Registration Form --- */

      .registration-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
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
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.fetchEvents();
  }

  private getStoreId(): string | null {
    return activeStoreId.get() || this.activeOrganizationId || null;
  }

  private async fetchEvents() {
    const storeId = this.getStoreId();
    if (!storeId) {
      this.loading = false;
      this.events = [];
      return;
    }

    this.loading = true;
    this.error = '';

    const now = new Date();
    const { dateFrom, dateTo } = getMonthDateRange(now.getFullYear(), now.getMonth());

    try {
      const result = await execute(GetPublicEventsQuery, {
        organizationId: storeId,
        dateFrom,
        dateTo,
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.events = (result.data.getPublicEvents as PublicEvent[]) ?? [];
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load events';
    } finally {
      this.loading = false;
    }
  }

  private async fetchEventsForMonth(year: number, month: number) {
    const storeId = this.getStoreId();
    if (!storeId) return;

    this.loading = true;
    this.error = '';
    const { dateFrom, dateTo } = getMonthDateRange(year, month);

    try {
      const result = await execute(GetPublicEventsQuery, {
        organizationId: storeId,
        dateFrom,
        dateTo,
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.events = (result.data.getPublicEvents as PublicEvent[]) ?? [];
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load events';
    } finally {
      this.loading = false;
    }
  }

  private handleStoreChanged() {
    this.selectedDate = null;
    this.selectedEvent = null;
    this.showRegistration = false;
    this.fetchEvents();
  }

  private handleDateSelected(e: CustomEvent<{ date: string }>) {
    this.selectedDate = e.detail.date;
    this.selectedEvent = null;
    this.showRegistration = false;
    this.registrationSuccess = false;
    this.registrationError = '';
  }

  private handleMonthChanged(e: CustomEvent<{ year: number; month: number }>) {
    this.fetchEventsForMonth(e.detail.year, e.detail.month);
  }

  private handleEventClick(event: PublicEvent) {
    this.selectedEvent = event;
    this.showRegistration = false;
    this.registrationSuccess = false;
    this.registrationError = '';
    this.registrationName = '';
    this.registrationEmail = '';
    this.registrationPhone = '';
  }

  private handleBackToList() {
    this.selectedEvent = null;
    this.showRegistration = false;
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

  private openRegistrationForm() {
    this.showRegistration = true;
    this.registrationSuccess = false;
    this.registrationError = '';
  }

  private async handleRegister(e: Event) {
    e.preventDefault();

    if (!this.registrationName.trim()) {
      this.registrationError = 'Name is required.';
      return;
    }

    if (!this.selectedEvent) return;

    this.registering = true;
    this.registrationError = '';

    try {
      const result = await execute(RegisterForEventMutation, {
        eventId: this.selectedEvent.id,
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
        if (this.selectedEvent) {
          const updated = { ...this.selectedEvent, registrationCount: this.selectedEvent.registrationCount + 1 };
          this.selectedEvent = updated;
          this.events = this.events.map((ev) => (ev.id === updated.id ? updated : ev));
        }
      }
    } catch (e) {
      this.registrationError = e instanceof Error ? e.message : 'Registration failed';
    } finally {
      this.registering = false;
    }
  }

  private get filteredEvents(): PublicEvent[] {
    if (!this.selectedDate) return this.events;
    return this.events.filter((event) => {
      const eventDate = new Date(event.startTime);
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${eventDate.getFullYear()}-${pad(eventDate.getMonth() + 1)}-${pad(eventDate.getDate())}`;
      return dateStr === this.selectedDate;
    });
  }

  private isEventFull(event: PublicEvent): boolean {
    return event.capacity != null && event.registrationCount >= event.capacity;
  }

  render() {
    return this.renderPage(
      html`
        ${this.renderPageHeader()}
        ${when(
          this.error,
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
              <span>Loading events...</span>
            </div>
          `,
          () => this.renderContent(),
        )}
      `,
      {
        activePage: 'events',
        showUserMenu: true,
        showStoreSelector: this.showStoreSelector,
        onStoreChanged: () => this.handleStoreChanged(),
      },
    );
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-icon">
          <wa-icon name="calendar" style="font-size: 1.5rem;"></wa-icon>
        </div>
        <div class="page-header-content">
          <h2>Events</h2>
          <p>Browse upcoming events and register to play</p>
        </div>
      </div>
    `;
  }

  private renderContent() {
    if (!this.getStoreId()) {
      return html`
        <div class="empty-state">
          <wa-icon name="store"></wa-icon>
          <h3>Select a Store</h3>
          <p>Choose a store from the selector above to see their upcoming events.</p>
        </div>
      `;
    }

    return html`
      <div class="events-layout">
        <div class="calendar-sidebar">
          <ogs-event-calendar
            .events="${this.events}"
            .selectedDate="${this.selectedDate}"
            @date-selected="${this.handleDateSelected}"
            @month-changed="${this.handleMonthChanged}"
          ></ogs-event-calendar>
        </div>
        <div class="events-content">${this.selectedEvent ? this.renderEventDetail() : this.renderEventList()}</div>
      </div>
    `;
  }

  private renderEventList() {
    const events = this.filteredEvents;
    const headerDate = this.selectedDate
      ? new Date(this.selectedDate + 'T00:00:00').toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      : 'All Events This Month';

    if (events.length === 0) {
      return html`
        <div class="empty-state">
          <wa-icon name="calendar-xmark"></wa-icon>
          <h3>No Events</h3>
          <p>${this.selectedDate ? 'No events scheduled for this date.' : 'No events scheduled this month.'}</p>
        </div>
      `;
    }

    return html`
      <h3 class="events-list-header">${headerDate}</h3>
      <div class="events-list">
        ${events.map(
          (event) => html`
            <wa-card class="event-card" appearance="outline" @click="${() => this.handleEventClick(event)}">
              <div class="event-card-content">
                <div class="event-card-header">
                  <span class="event-card-title">${event.name}</span>
                  <div style="display: flex; gap: 0.375rem; align-items: center;">
                    <wa-badge variant="neutral">${formatEventType(event.eventType)}</wa-badge>
                    ${this.isEventFull(event) ? html`<wa-badge variant="danger">Event Full</wa-badge>` : nothing}
                  </div>
                </div>
                <div class="event-card-meta">
                  <span>
                    <wa-icon name="clock" style="font-size: 0.875rem;"></wa-icon>
                    ${formatTime(event.startTime)}
                    ${event.endTime ? html`&ndash; ${formatTime(event.endTime)}` : nothing}
                  </span>
                  ${event.gameDisplayName
                    ? html`
                        <span>
                          <wa-icon name="dice" style="font-size: 0.875rem;"></wa-icon>
                          ${event.gameDisplayName}
                        </span>
                      `
                    : nothing}
                  <span>
                    <wa-icon name="dollar-sign" style="font-size: 0.875rem;"></wa-icon>
                    ${formatEntryFee(event.entryFeeInCents)}
                  </span>
                  ${event.capacity != null
                    ? html`
                        <span>
                          <wa-icon name="users" style="font-size: 0.875rem;"></wa-icon>
                          ${event.registrationCount}/${event.capacity}
                        </span>
                      `
                    : html`
                        <span>
                          <wa-icon name="users" style="font-size: 0.875rem;"></wa-icon>
                          ${event.registrationCount} registered
                        </span>
                      `}
                </div>
              </div>
            </wa-card>
          `,
        )}
      </div>
    `;
  }

  private renderEventDetail() {
    const event = this.selectedEvent!;
    const isFull = this.isEventFull(event);

    return html`
      <div>
        <wa-button
          class="back-button"
          size="small"
          variant="neutral"
          appearance="text"
          @click="${this.handleBackToList}"
        >
          <wa-icon slot="start" name="arrow-left"></wa-icon>
          Back to events
        </wa-button>

        <div class="event-detail">
          <div class="event-detail-header">
            <h3 class="event-detail-title">${event.name}</h3>
            <div style="display: flex; gap: 0.375rem; align-items: center; flex-shrink: 0;">
              <wa-badge variant="neutral">${formatEventType(event.eventType)}</wa-badge>
              ${isFull ? html`<wa-badge variant="danger">Event Full</wa-badge>` : nothing}
            </div>
          </div>

          <div class="event-detail-meta">
            <div class="meta-item">
              <wa-icon name="calendar" style="font-size: 1rem;"></wa-icon>
              ${formatDateTime(event.startTime)}
              ${event.endTime ? html` &ndash; ${formatTime(event.endTime)}` : nothing}
            </div>
            ${event.gameDisplayName
              ? html`
                  <div class="meta-item">
                    <wa-icon name="dice" style="font-size: 1rem;"></wa-icon>
                    ${event.gameDisplayName}
                  </div>
                `
              : nothing}
            <div class="meta-item">
              <wa-icon name="dollar-sign" style="font-size: 1rem;"></wa-icon>
              Entry: ${formatEntryFee(event.entryFeeInCents)}
            </div>
            <div class="meta-item">
              <wa-icon name="users" style="font-size: 1rem;"></wa-icon>
              ${event.capacity != null
                ? html`${event.registrationCount} / ${event.capacity} spots filled`
                : html`${event.registrationCount} registered`}
            </div>
          </div>

          ${event.description ? html`<div class="event-detail-description">${event.description}</div>` : nothing}

          <wa-divider></wa-divider>

          ${event.capacity != null
            ? html`
                <div class="capacity-info ${isFull ? 'full' : ''}">
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
              <wa-button variant="brand" style="margin-top: 1rem;" @click="${this.openRegistrationForm}">
                <wa-icon slot="start" name="pen-to-square"></wa-icon>
                Register for Event
              </wa-button>
            `,
          )}
          ${when(this.showRegistration, () => this.renderRegistrationForm())}
        </div>
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
