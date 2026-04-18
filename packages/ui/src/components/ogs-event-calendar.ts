import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

interface CalendarEvent {
  startTime: string;
}

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

@customElement('ogs-event-calendar')
export class OgsEventCalendar extends LitElement {
  @property({ type: Array }) events: CalendarEvent[] = [];
  @property({ type: String }) selectedDate: string | null = null;

  @state() currentYear = new Date().getFullYear();
  @state() currentMonth = new Date().getMonth();

  static styles = css`
    :host {
      display: block;
    }

    .calendar {
      background: var(--wa-color-surface-raised);
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-l);
      padding: 1rem;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .calendar-title {
      font-size: var(--wa-font-size-l);
      font-weight: 700;
    }

    .calendar-nav {
      display: flex;
      gap: 0.25rem;
    }

    .day-headers {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-bottom: 0.25rem;
    }

    .day-header {
      text-align: center;
      font-size: var(--wa-font-size-xs);
      font-weight: 600;
      color: var(--wa-color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.5rem 0;
    }

    .day-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }

    .day-cell {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
      border-radius: var(--wa-border-radius-m);
      cursor: pointer;
      font-size: var(--wa-font-size-s);
      transition:
        background 0.15s ease,
        color 0.15s ease;
      border: 2px solid transparent;
    }

    .day-cell:hover {
      background: var(--wa-color-surface-sunken);
    }

    .day-cell.other-month {
      color: var(--wa-color-text-muted);
      opacity: 0.4;
    }

    .day-cell.today {
      font-weight: 700;
      border-color: var(--wa-color-brand-fill-normal);
    }

    .day-cell.selected {
      background: var(--wa-color-brand-fill-normal);
      color: var(--wa-color-brand-on-normal);
    }

    .day-cell.selected:hover {
      background: var(--wa-color-brand-fill-hover);
    }

    .event-dot {
      position: absolute;
      bottom: 4px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--wa-color-brand-fill-normal);
    }

    .day-cell.selected .event-dot {
      background: var(--wa-color-brand-on-normal);
    }
  `;

  private get eventDateSet(): Set<string> {
    const dates = new Set<string>();
    for (const event of this.events) {
      const d = new Date(event.startTime);
      dates.add(this.formatDate(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    return dates;
  }

  private formatDate(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  private getFirstDayOfWeek(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
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

    this.dispatchEvent(
      new CustomEvent('month-changed', {
        detail: { year: this.currentYear, month: this.currentMonth },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleDayClick(year: number, month: number, day: number) {
    const date = this.formatDate(year, month, day);
    this.dispatchEvent(
      new CustomEvent('date-selected', {
        detail: { date },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const today = new Date();
    const todayStr = this.formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    const eventDates = this.eventDateSet;

    const daysInMonth = this.getDaysInMonth(this.currentYear, this.currentMonth);
    const firstDay = this.getFirstDayOfWeek(this.currentYear, this.currentMonth);

    // Previous month trailing days
    const prevMonth = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
    const prevYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
    const daysInPrevMonth = this.getDaysInMonth(prevYear, prevMonth);

    const cells: Array<{ year: number; month: number; day: number; otherMonth: boolean }> = [];

    // Leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ year: prevYear, month: prevMonth, day: daysInPrevMonth - i, otherMonth: true });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ year: this.currentYear, month: this.currentMonth, day: d, otherMonth: false });
    }

    // Trailing days from next month
    const nextMonth = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
    const nextYear = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({ year: nextYear, month: nextMonth, day: d, otherMonth: true });
      }
    }

    return html`
      <div class="calendar">
        <div class="calendar-header">
          <span class="calendar-title">${MONTH_NAMES[this.currentMonth]} ${this.currentYear}</span>
          <div class="calendar-nav">
            <wa-button size="small" variant="neutral" appearance="text" @click="${() => this.navigateMonth(-1)}">
              <wa-icon name="chevron-left"></wa-icon>
            </wa-button>
            <wa-button size="small" variant="neutral" appearance="text" @click="${() => this.navigateMonth(1)}">
              <wa-icon name="chevron-right"></wa-icon>
            </wa-button>
          </div>
        </div>

        <div class="day-headers">${DAY_NAMES.map((name) => html`<div class="day-header">${name}</div>`)}</div>

        <div class="day-grid">
          ${cells.map((cell) => {
            const dateStr = this.formatDate(cell.year, cell.month, cell.day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === this.selectedDate;
            const hasEvents = eventDates.has(dateStr);

            return html`
              <div
                class="day-cell ${cell.otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected
                  ? 'selected'
                  : ''}"
                @click="${() => this.handleDayClick(cell.year, cell.month, cell.day)}"
              >
                ${cell.day} ${hasEvents ? html`<span class="event-dot"></span>` : ''}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }
}
