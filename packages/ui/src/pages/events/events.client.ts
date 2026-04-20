import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import { execute } from '../../lib/graphql.ts';
import { graphql } from '../../graphql/index.ts';
import { activeStoreId } from '../../lib/store-context';
import { storeUrl } from '../../lib/store-url';
import { formatTime, getEventColor } from '../../lib/event-helpers.ts';

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

// --- Constants ---

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Max event chips to show in a day cell before showing "+N more" */
const MAX_VISIBLE_EVENTS = 3;

// --- Helpers ---

/**
 * Compute the visible date range for the calendar grid. This covers the full
 * grid from the first visible Sunday to the last visible Saturday, so events
 * on overflow days from the previous/next month are also fetched.
 */
function getVisibleDateRange(year: number, month: number): { dateFrom: string; dateTo: string } {
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // First day of the month and its day-of-week (0=Sun)
  const firstOfMonth = new Date(year, month, 1);
  const firstDow = firstOfMonth.getDay();

  // Grid starts on the Sunday before (or on) the 1st
  const gridStart = new Date(year, month, 1 - firstDow);

  // Last day of the month
  const lastOfMonth = new Date(year, month + 1, 0);
  const lastDow = lastOfMonth.getDay();

  // Grid ends on the Saturday after (or on) the last day
  const gridEnd = new Date(year, month + 1, 0 + (6 - lastDow));

  return { dateFrom: fmt(gridStart), dateTo: fmt(gridEnd) };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// --- Component ---

@customElement('ogs-events-page')
export class EventsPage extends OgsPageBase {
  @property({ type: Boolean }) showStoreSelector = false;

  @state() events: PublicEvent[] = [];
  @state() loading = true;
  @state() error = '';
  @state() currentYear = new Date().getFullYear();
  @state() currentMonth = new Date().getMonth();

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
        font-size: var(--wa-font-size-m);
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
        font-size: var(--wa-font-size-m);
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

      /* --- Calendar toolbar --- */

      .calendar-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        gap: 0.75rem;
      }

      .calendar-toolbar-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .calendar-month-title {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
        min-width: 200px;
      }

      .calendar-nav {
        display: flex;
        gap: 0.25rem;
      }

      /* --- Month grid --- */

      .calendar-grid {
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        overflow: hidden;
      }

      .day-headers {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .day-header {
        text-align: center;
        font-size: var(--wa-font-size-xs);
        font-weight: 600;
        color: var(--wa-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 0.625rem 0;
      }

      .week-row {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .week-row:last-child {
        border-bottom: none;
      }

      .day-cell {
        min-height: 110px;
        padding: 0.375rem;
        border-right: 1px solid var(--wa-color-surface-border);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .day-cell:last-child {
        border-right: none;
      }

      .day-cell.other-month {
        background: var(--wa-color-surface-sunken);
      }

      .day-cell.other-month .day-number {
        opacity: 0.4;
      }

      .day-cell.today .day-number {
        background: var(--wa-color-brand-fill-normal);
        color: var(--wa-color-brand-on-normal);
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .day-number {
        font-size: var(--wa-font-size-m);
        font-weight: 500;
        margin-bottom: 0.25rem;
        line-height: 28px;
        width: 28px;
        text-align: center;
      }

      .day-events {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        overflow: hidden;
      }

      /* --- Event chips --- */

      .event-chip {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 11px;
        line-height: 1.3;
        cursor: pointer;
        overflow: hidden;
        text-decoration: none;
        border-left: 3px solid;
        transition:
          opacity 0.1s ease,
          filter 0.1s ease;
      }

      .event-chip:hover {
        filter: brightness(0.92);
      }

      .more-link {
        font-size: 11px;
        color: var(--wa-color-text-muted);
        padding: 1px 4px;
        cursor: default;
      }

      /* --- Responsive --- */

      @media (max-width: 768px) {
        .day-cell {
          min-height: 80px;
          padding: 0.25rem;
        }

        .event-chip {
          font-size: 10px;
          padding: 1px 3px;
        }

        .calendar-month-title {
          font-size: var(--wa-font-size-l);
          min-width: unset;
        }
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

    const { dateFrom, dateTo } = getVisibleDateRange(this.currentYear, this.currentMonth);

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
    this.fetchEvents();
  }

  private navigateMonth(delta: number) {
    let newMonth = this.currentMonth + delta;
    let newYear = this.currentYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    this.currentMonth = newMonth;
    this.currentYear = newYear;
    this.fetchEvents();
  }

  private goToToday() {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
    this.fetchEvents();
  }

  /** Group events by date string (YYYY-MM-DD) for quick lookup when rendering cells. */
  private get eventsByDate(): Map<string, PublicEvent[]> {
    const map = new Map<string, PublicEvent[]>();
    for (const event of this.events) {
      const d = new Date(event.startTime);
      const key = formatDate(d.getFullYear(), d.getMonth(), d.getDate());
      const list = map.get(key);
      if (list) {
        list.push(event);
      } else {
        map.set(key, [event]);
      }
    }
    return map;
  }

  /** Build the calendar grid: array of weeks, each week is an array of day cell data. */
  private get calendarWeeks(): Array<
    Array<{
      year: number;
      month: number;
      day: number;
      otherMonth: boolean;
      dateStr: string;
    }>
  > {
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const firstDow = new Date(this.currentYear, this.currentMonth, 1).getDay();

    // Previous month trailing days
    const prevMonth = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
    const prevYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
    const daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate();

    const cells: Array<{
      year: number;
      month: number;
      day: number;
      otherMonth: boolean;
      dateStr: string;
    }> = [];

    // Leading days from previous month
    for (let i = firstDow - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      cells.push({
        year: prevYear,
        month: prevMonth,
        day: d,
        otherMonth: true,
        dateStr: formatDate(prevYear, prevMonth, d),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        year: this.currentYear,
        month: this.currentMonth,
        day: d,
        otherMonth: false,
        dateStr: formatDate(this.currentYear, this.currentMonth, d),
      });
    }

    // Trailing days from next month
    const nextMonth = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
    const nextYear = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({
          year: nextYear,
          month: nextMonth,
          day: d,
          otherMonth: true,
          dateStr: formatDate(nextYear, nextMonth, d),
        });
      }
    }

    // Split into weeks
    const weeks: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
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

    return html` ${this.renderToolbar()} ${this.renderCalendarGrid()} `;
  }

  private renderToolbar() {
    return html`
      <div class="calendar-toolbar">
        <div class="calendar-toolbar-left">
          <wa-button size="small" variant="neutral" @click="${this.goToToday}">Today</wa-button>
          <div class="calendar-nav">
            <wa-button size="small" variant="neutral" appearance="plain" @click="${() => this.navigateMonth(-1)}">
              <wa-icon name="chevron-left"></wa-icon>
            </wa-button>
            <wa-button size="small" variant="neutral" appearance="plain" @click="${() => this.navigateMonth(1)}">
              <wa-icon name="chevron-right"></wa-icon>
            </wa-button>
          </div>
          <span class="calendar-month-title">${MONTH_NAMES[this.currentMonth]} ${this.currentYear}</span>
        </div>
      </div>
    `;
  }

  private renderCalendarGrid() {
    const today = new Date();
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    const eventsByDate = this.eventsByDate;
    const weeks = this.calendarWeeks;

    return html`
      <div class="calendar-grid">
        <div class="day-headers">${DAY_NAMES.map((name) => html`<div class="day-header">${name}</div>`)}</div>
        ${weeks.map(
          (week) => html`
            <div class="week-row">
              ${week.map((cell) => {
                const isToday = cell.dateStr === todayStr;
                const dayEvents = eventsByDate.get(cell.dateStr) ?? [];

                return html`
                  <div class="day-cell ${cell.otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}">
                    <div class="day-number">${cell.day}</div>
                    <div class="day-events">
                      ${dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => this.renderEventChip(event))}
                      ${dayEvents.length > MAX_VISIBLE_EVENTS
                        ? html`<span class="more-link">+${dayEvents.length - MAX_VISIBLE_EVENTS} more</span>`
                        : nothing}
                    </div>
                  </div>
                `;
              })}
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderEventChip(event: PublicEvent) {
    const color = getEventColor(event.eventType);
    return html`
      <a
        class="event-chip"
        href="${storeUrl(`/events/${event.id}`)}"
        style="background: ${color.bg}; color: ${color.text}; border-color: ${color.border};"
        title="${event.name}"
      >
        ${formatTime(event.startTime)} ${event.name}
      </a>
    `;
  }
}
