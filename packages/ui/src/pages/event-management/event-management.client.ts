import { css, html, nothing, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import nativeStyle from '@awesome.me/webawesome/dist/styles/native.css?inline';
import utilityStyles from '@awesome.me/webawesome/dist/styles/utilities.css?inline';
import { OgsPageBase } from '../../components/ogs-page-base.ts';
import { execute } from '../../lib/graphql.ts';
import { graphql } from '../../graphql/index.ts';
import type { EventType, RecurrenceFrequency } from '../../graphql/graphql.ts';
import { GetSupportedGamesQuery } from '../../lib/shared-queries.ts';
import type WaInput from '@awesome.me/webawesome/dist/components/input/input.js';
import type WaSelect from '@awesome.me/webawesome/dist/components/select/select.js';
import type WaTextarea from '@awesome.me/webawesome/dist/components/textarea/textarea.js';

if (typeof globalThis.document !== 'undefined') {
  import('@awesome.me/webawesome/dist/components/dialog/dialog.js');
}

// --- Types ---

interface EventItem {
  id: number;
  name: string;
  eventType: string;
  gameName: string | null;
  gameDisplayName: string | null;
  startTime: string;
  endTime: string | null;
  capacity: number | null;
  status: string;
  registrationCount: number;
  recurrenceGroupId: string | null;
  isRecurrenceTemplate: boolean;
}

interface EventDetail {
  id: number;
  organizationId: string;
  name: string;
  description: string | null;
  eventType: string;
  categoryId: number | null;
  gameName: string | null;
  gameDisplayName: string | null;
  startTime: string;
  endTime: string | null;
  capacity: number | null;
  entryFeeInCents: number | null;
  status: string;
  registrationCount: number;
  recurrenceRule: { frequency: string } | null;
  recurrenceGroupId: string | null;
  isRecurrenceTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventRegistration {
  id: number;
  registrantName: string;
  registrantEmail: string | null;
  registrantPhone: string | null;
  status: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
}

interface SupportedGame {
  categoryId: number;
  name: string;
  displayName: string;
}

// --- GraphQL ---

const GetEventsQuery = graphql(`
  query GetEvents($pagination: PaginationInput, $filters: EventFilters) {
    getEvents(pagination: $pagination, filters: $filters) {
      items {
        id
        name
        eventType
        gameName
        gameDisplayName
        startTime
        endTime
        capacity
        status
        registrationCount
        recurrenceGroupId
        isRecurrenceTemplate
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`);

const GetEventQuery = graphql(`
  query GetEvent($id: Int!) {
    getEvent(id: $id) {
      id
      organizationId
      name
      description
      eventType
      categoryId
      gameName
      gameDisplayName
      startTime
      endTime
      capacity
      entryFeeInCents
      status
      registrationCount
      recurrenceRule {
        frequency
      }
      recurrenceGroupId
      isRecurrenceTemplate
      createdAt
      updatedAt
    }
  }
`);

const GetEventRegistrationsQuery = graphql(`
  query GetEventRegistrations($eventId: Int!) {
    getEventRegistrations(eventId: $eventId) {
      id
      registrantName
      registrantEmail
      registrantPhone
      status
      checkedIn
      checkedInAt
      createdAt
    }
  }
`);

const CreateEventMutation = graphql(`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      name
      status
    }
  }
`);

const UpdateEventMutation = graphql(`
  mutation UpdateEvent($id: Int!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      name
      status
    }
  }
`);

const CancelEventMutation = graphql(`
  mutation CancelEvent($id: Int!) {
    cancelEvent(id: $id) {
      id
      status
    }
  }
`);

const CancelRecurringSeriesMutation = graphql(`
  mutation CancelRecurringSeries($recurrenceGroupId: String!) {
    cancelRecurringSeries(recurrenceGroupId: $recurrenceGroupId)
  }
`);

const UpdateRecurrenceRuleMutation = graphql(`
  mutation UpdateRecurrenceRule($recurrenceGroupId: String!, $frequency: RecurrenceFrequency!) {
    updateRecurrenceRule(recurrenceGroupId: $recurrenceGroupId, frequency: $frequency) {
      id
      recurrenceRule {
        frequency
      }
    }
  }
`);

const AddEventRegistrationMutation = graphql(`
  mutation AddEventRegistration($eventId: Int!, $input: AdminEventRegistrationInput!) {
    addEventRegistration(eventId: $eventId, input: $input) {
      id
      registrantName
      status
    }
  }
`);

const CancelEventRegistrationMutation = graphql(`
  mutation CancelEventRegistration($registrationId: Int!) {
    cancelEventRegistration(registrationId: $registrationId) {
      id
      status
    }
  }
`);

const CheckInEventRegistrationMutation = graphql(`
  mutation CheckInEventRegistration($registrationId: Int!) {
    checkInEventRegistration(registrationId: $registrationId) {
      id
      checkedIn
      checkedInAt
    }
  }
`);

// --- Helpers ---

const EVENT_TYPE_LABELS: Record<string, string> = {
  TOURNAMENT: 'Tournament',
  CASUAL_PLAY: 'Casual Play',
  RELEASE_EVENT: 'Release Event',
  DRAFT: 'Draft',
  PRERELEASE: 'Prerelease',
  LEAGUE: 'League',
  OTHER: 'Other',
};

function formatEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
};

function formatRecurrenceFrequency(frequency: string): string {
  return RECURRENCE_LABELS[frequency] ?? frequency;
}

function formatEntryFee(cents: number | null): string {
  if (cents == null || cents === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDateTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString();
  } catch {
    return isoStr;
  }
}

function statusVariant(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    case 'COMPLETED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

// --- Component ---

@customElement('ogs-event-management-page')
export class OgsEventManagementPage extends OgsPageBase {
  @property({ type: Boolean }) showUserMenu = false;

  // --- List state ---
  @state() private events: EventItem[] = [];
  @state() private loading = true;
  @state() private error = '';
  @state() private page = 1;
  @state() private pageSize = 25;
  @state() private totalCount = 0;
  @state() private totalPages = 0;
  @state() private statusFilter = '';
  @state() private eventTypeFilter = '';

  // --- Detail state ---
  @state() private selectedEvent: EventDetail | null = null;
  @state() private registrations: EventRegistration[] = [];
  @state() private detailLoading = false;
  @state() private detailError = '';

  // --- Supported games ---
  @state() private supportedGames: SupportedGame[] = [];

  // --- Create/Edit dialog state ---
  @state() private showEventDialog = false;
  @state() private editingEvent: EventDetail | null = null;
  @state() private saving = false;
  @state() private dialogError = '';

  // --- Form fields ---
  @state() private formName = '';
  @state() private formDescription = '';
  @state() private formEventType = '';
  @state() private formCategoryId = '';
  @state() private formStartTime = '';
  @state() private formEndTime = '';
  @state() private formCapacity = '';
  @state() private formEntryFee = '';
  @state() private formRecurrenceFrequency = '';

  // --- Add registration dialog ---
  @state() private showAddRegistrationDialog = false;
  @state() private regName = '';
  @state() private regEmail = '';
  @state() private regPhone = '';
  @state() private addingRegistration = false;
  @state() private regError = '';

  // --- Confirm dialogs ---
  @state() private showCancelEventDialog = false;
  @state() private showCancelSeriesDialog = false;

  // --- Edit recurrence dialog ---
  @state() private showEditRecurrenceDialog = false;
  @state() private editRecurrenceFrequency = '';
  @state() private editRecurrenceSaving = false;
  @state() private editRecurrenceError = '';

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
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
      }

      .page-header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
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

      /* --- Stats Bar --- */

      .stats-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }

      .stat-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.25rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
        min-width: 140px;
        flex: 1;
      }

      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: var(--wa-border-radius-m);
        background: var(--wa-color-brand-container);
        color: var(--wa-color-brand-text);
        font-size: 1.125rem;
        flex-shrink: 0;
      }

      .stat-icon.success {
        background: var(--wa-color-success-container);
        color: var(--wa-color-success-text);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .stat-label {
        font-size: var(--wa-font-size-xs);
        color: var(--wa-color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-weight: 600;
      }

      .stat-value {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
        line-height: 1;
      }

      /* --- Filter Bar --- */

      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
        align-items: flex-end;
        padding: 1rem;
        background: var(--wa-color-surface-raised);
        border: 1px solid var(--wa-color-surface-border);
        border-radius: var(--wa-border-radius-l);
      }

      .filter-bar wa-select {
        flex: 0 0 auto;
        min-width: 160px;
        width: auto;
      }

      /* --- Table --- */

      .table-container {
        overflow-x: auto;
      }

      .wa-table {
        width: 100%;
        border-collapse: collapse;
      }

      .wa-table th,
      .wa-table td {
        vertical-align: middle;
      }

      .wa-table th {
        font-size: var(--wa-font-size-s);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--wa-color-text-muted);
        font-weight: 600;
        padding: 0.875rem 1rem;
        text-align: left;
        border-bottom: 2px solid var(--wa-color-surface-border);
      }

      .wa-table td {
        padding: 0.875rem 1rem;
        font-size: var(--wa-font-size-m);
        border-bottom: 1px solid var(--wa-color-surface-border);
      }

      .wa-table tr:last-child td {
        border-bottom: none;
      }

      .wa-table tbody tr {
        transition: background 0.15s ease;
        cursor: pointer;
      }

      .wa-table tbody tr:hover td {
        background: var(--wa-color-surface-sunken);
      }

      .actions-cell {
        white-space: nowrap;
      }

      .actions-cell-inner {
        display: flex;
        gap: 0.25rem;
      }

      /* --- Pagination --- */

      .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .pagination-info {
        color: var(--wa-color-text-muted);
        font-size: var(--wa-font-size-m);
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .pagination-buttons {
        display: flex;
        gap: 0.25rem;
        align-items: center;
      }

      /* --- Loading & Empty States --- */

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

      .empty-state > wa-icon {
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

      /* --- Detail View --- */

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .detail-title {
        font-size: var(--wa-font-size-xl);
        font-weight: 700;
        margin: 0;
      }

      .detail-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        margin: 1rem 0;
        font-size: var(--wa-font-size-m);
        color: var(--wa-color-text-muted);
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      .detail-description {
        margin: 1rem 0;
        font-size: var(--wa-font-size-m);
        line-height: 1.6;
        color: var(--wa-color-text-normal);
      }

      .detail-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        margin-top: 1.5rem;
      }

      .section-title {
        font-size: var(--wa-font-size-l);
        font-weight: 700;
        margin: 0;
      }

      /* --- Dialog Form --- */

      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-row {
        display: flex;
        gap: 1rem;
      }

      .form-row > * {
        flex: 1;
      }

      @media (max-width: 600px) {
        .form-row {
          flex-direction: column;
        }
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.fetchEvents();
    this.fetchSupportedGames();
  }

  // --- Data fetching ---

  private async fetchEvents() {
    this.loading = true;
    this.error = '';

    try {
      const filters: Record<string, unknown> = {};
      if (this.statusFilter) filters.status = this.statusFilter;
      if (this.eventTypeFilter) filters.eventType = this.eventTypeFilter;

      const result = await execute(GetEventsQuery, {
        pagination: { page: this.page, pageSize: this.pageSize },
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });

      if (result?.errors?.length) {
        this.error = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        const data = result.data.getEvents;
        this.events = data.items as EventItem[];
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load events';
    } finally {
      this.loading = false;
    }
  }

  private async fetchSupportedGames() {
    try {
      const result = await execute(GetSupportedGamesQuery);
      if (result?.data?.getSupportedGames) {
        this.supportedGames = result.data.getSupportedGames as SupportedGame[];
      }
    } catch {
      // Non-critical — games dropdown will be empty
    }
  }

  private async fetchEventDetail(id: number) {
    this.detailLoading = true;
    this.detailError = '';

    try {
      const [eventResult, regResult] = await Promise.all([
        execute(GetEventQuery, { id }),
        execute(GetEventRegistrationsQuery, { eventId: id }),
      ]);

      if (eventResult?.errors?.length) {
        this.detailError = eventResult.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.selectedEvent = eventResult.data.getEvent as EventDetail | null;
      }

      if (regResult?.errors?.length) {
        this.detailError = regResult.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.registrations = regResult.data.getEventRegistrations as EventRegistration[];
      }
    } catch (e) {
      this.detailError = e instanceof Error ? e.message : 'Failed to load event details';
    } finally {
      this.detailLoading = false;
    }
  }

  private async refreshRegistrations() {
    if (!this.selectedEvent) return;
    try {
      const result = await execute(GetEventRegistrationsQuery, { eventId: this.selectedEvent.id });
      if (!result?.errors?.length) {
        this.registrations = result.data.getEventRegistrations as EventRegistration[];
      }
    } catch {
      // Silently fail on refresh
    }
  }

  // --- Event handlers ---

  private handleEventClick(event: EventItem) {
    this.fetchEventDetail(event.id);
  }

  private handleBackToList() {
    this.selectedEvent = null;
    this.registrations = [];
    this.detailError = '';
    this.fetchEvents();
  }

  private handleStatusFilterChange(event: Event) {
    const select = event.target as WaSelect;
    this.statusFilter = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);
    this.page = 1;
    this.fetchEvents();
  }

  private handleEventTypeFilterChange(event: Event) {
    const select = event.target as WaSelect;
    this.eventTypeFilter = Array.isArray(select.value) ? select.value.join(',') : (select.value as string);
    this.page = 1;
    this.fetchEvents();
  }

  private goToPage(newPage: number) {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.fetchEvents();
  }

  // --- Create/Edit dialog ---

  private openCreateDialog() {
    this.editingEvent = null;
    this.formName = '';
    this.formDescription = '';
    this.formEventType = '';
    this.formCategoryId = '';
    this.formStartTime = '';
    this.formEndTime = '';
    this.formCapacity = '';
    this.formEntryFee = '';
    this.formRecurrenceFrequency = '';
    this.dialogError = '';
    this.showEventDialog = true;
  }

  private openEditDialog() {
    if (!this.selectedEvent) return;
    const ev = this.selectedEvent;
    this.editingEvent = ev;
    this.formName = ev.name;
    this.formDescription = ev.description ?? '';
    this.formEventType = ev.eventType;
    this.formCategoryId = ev.categoryId != null ? String(ev.categoryId) : '';
    // Convert ISO to datetime-local format
    this.formStartTime = ev.startTime ? ev.startTime.slice(0, 16) : '';
    this.formEndTime = ev.endTime ? ev.endTime.slice(0, 16) : '';
    this.formCapacity = ev.capacity != null ? String(ev.capacity) : '';
    this.formEntryFee = ev.entryFeeInCents != null ? String(ev.entryFeeInCents / 100) : '';
    this.formRecurrenceFrequency = '';
    this.dialogError = '';
    this.showEventDialog = true;
  }

  private async handleSaveEvent() {
    if (!this.formName.trim()) {
      this.dialogError = 'Name is required.';
      return;
    }
    if (!this.formEventType) {
      this.dialogError = 'Event type is required.';
      return;
    }
    if (!this.formStartTime) {
      this.dialogError = 'Start time is required.';
      return;
    }

    this.saving = true;
    this.dialogError = '';

    try {
      if (this.editingEvent) {
        // Update
        const input: Record<string, unknown> = {
          name: this.formName.trim(),
          description: this.formDescription.trim() || null,
          eventType: this.formEventType,
          categoryId: this.formCategoryId ? Number.parseInt(this.formCategoryId, 10) : null,
          startTime: new Date(this.formStartTime).toISOString(),
          endTime: this.formEndTime ? new Date(this.formEndTime).toISOString() : null,
          capacity: this.formCapacity ? Number.parseInt(this.formCapacity, 10) : null,
          entryFeeInCents: this.formEntryFee ? Math.round(Number.parseFloat(this.formEntryFee) * 100) : null,
        };

        const result = await execute(UpdateEventMutation, {
          id: this.editingEvent.id,
          input,
        });

        if (result?.errors?.length) {
          this.dialogError = result.errors.map((e: { message: string }) => e.message).join(', ');
          return;
        }

        this.showEventDialog = false;
        this.fetchEventDetail(this.editingEvent.id);
      } else {
        // Create
        const input = {
          name: this.formName.trim(),
          description: this.formDescription.trim() || null,
          eventType: this.formEventType as EventType,
          categoryId: this.formCategoryId ? Number.parseInt(this.formCategoryId, 10) : null,
          startTime: new Date(this.formStartTime).toISOString(),
          endTime: this.formEndTime ? new Date(this.formEndTime).toISOString() : null,
          capacity: this.formCapacity ? Number.parseInt(this.formCapacity, 10) : null,
          entryFeeInCents: this.formEntryFee ? Math.round(Number.parseFloat(this.formEntryFee) * 100) : null,
          recurrenceRule:
            this.formRecurrenceFrequency && this.formRecurrenceFrequency !== 'NONE'
              ? { frequency: this.formRecurrenceFrequency as RecurrenceFrequency }
              : null,
        };

        const result = await execute(CreateEventMutation, { input });

        if (result?.errors?.length) {
          this.dialogError = result.errors.map((e: { message: string }) => e.message).join(', ');
          return;
        }

        this.showEventDialog = false;
        this.page = 1;
        this.fetchEvents();
      }
    } catch (e) {
      this.dialogError = e instanceof Error ? e.message : 'Failed to save event';
    } finally {
      this.saving = false;
    }
  }

  // --- Cancel event ---

  private async handleCancelEvent() {
    if (!this.selectedEvent) return;

    try {
      const result = await execute(CancelEventMutation, { id: this.selectedEvent.id });
      if (result?.errors?.length) {
        this.detailError = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.fetchEventDetail(this.selectedEvent.id);
      }
    } catch (e) {
      this.detailError = e instanceof Error ? e.message : 'Failed to cancel event';
    } finally {
      this.showCancelEventDialog = false;
    }
  }

  private async handleCancelSeries() {
    if (!this.selectedEvent?.recurrenceGroupId) return;

    try {
      const result = await execute(CancelRecurringSeriesMutation, {
        recurrenceGroupId: this.selectedEvent.recurrenceGroupId,
      });
      if (result?.errors?.length) {
        this.detailError = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.handleBackToList();
      }
    } catch (e) {
      this.detailError = e instanceof Error ? e.message : 'Failed to cancel series';
    } finally {
      this.showCancelSeriesDialog = false;
    }
  }

  private async handleUpdateRecurrenceRule() {
    if (!this.selectedEvent?.recurrenceGroupId || !this.editRecurrenceFrequency) {
      this.editRecurrenceError = 'Frequency is required.';
      return;
    }

    this.editRecurrenceSaving = true;
    this.editRecurrenceError = '';

    try {
      const result = await execute(UpdateRecurrenceRuleMutation, {
        recurrenceGroupId: this.selectedEvent.recurrenceGroupId,
        frequency: this.editRecurrenceFrequency as RecurrenceFrequency,
      });

      if (result?.errors?.length) {
        this.editRecurrenceError = result.errors.map((e: { message: string }) => e.message).join(', ');
        return;
      }

      this.showEditRecurrenceDialog = false;
      this.fetchEventDetail(this.selectedEvent.id);
    } catch (e) {
      this.editRecurrenceError = e instanceof Error ? e.message : 'Failed to update recurrence';
    } finally {
      this.editRecurrenceSaving = false;
    }
  }

  // --- Registration actions ---

  private async handleAddRegistration() {
    if (!this.selectedEvent || !this.regName.trim()) {
      this.regError = 'Name is required.';
      return;
    }

    this.addingRegistration = true;
    this.regError = '';

    try {
      const result = await execute(AddEventRegistrationMutation, {
        eventId: this.selectedEvent.id,
        input: {
          registrantName: this.regName.trim(),
          ...(this.regEmail.trim() ? { registrantEmail: this.regEmail.trim() } : {}),
          ...(this.regPhone.trim() ? { registrantPhone: this.regPhone.trim() } : {}),
        },
      });

      if (result?.errors?.length) {
        this.regError = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.showAddRegistrationDialog = false;
        this.regName = '';
        this.regEmail = '';
        this.regPhone = '';
        this.refreshRegistrations();
        // Update registration count
        if (this.selectedEvent) {
          this.selectedEvent = {
            ...this.selectedEvent,
            registrationCount: this.selectedEvent.registrationCount + 1,
          };
        }
      }
    } catch (e) {
      this.regError = e instanceof Error ? e.message : 'Failed to add registration';
    } finally {
      this.addingRegistration = false;
    }
  }

  private async handleCancelRegistration(registrationId: number) {
    try {
      const result = await execute(CancelEventRegistrationMutation, { registrationId });
      if (result?.errors?.length) {
        this.detailError = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.refreshRegistrations();
      }
    } catch (e) {
      this.detailError = e instanceof Error ? e.message : 'Failed to cancel registration';
    }
  }

  private async handleCheckIn(registrationId: number) {
    try {
      const result = await execute(CheckInEventRegistrationMutation, { registrationId });
      if (result?.errors?.length) {
        this.detailError = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        this.refreshRegistrations();
      }
    } catch (e) {
      this.detailError = e instanceof Error ? e.message : 'Failed to check in';
    }
  }

  // --- Render ---

  render() {
    return this.renderPage(
      html`
        ${this.selectedEvent ? this.renderDetailMode() : this.renderListMode()} ${this.renderEventDialog()}
        ${this.renderAddRegistrationDialog()} ${this.renderCancelEventDialog()} ${this.renderCancelSeriesDialog()}
        ${this.renderEditRecurrenceDialog()}
      `,
      { activePage: 'event-management', showUserMenu: this.showUserMenu },
    );
  }

  // --- List Mode ---

  private renderListMode() {
    return html`
      ${this.renderPageHeader()} ${this.renderFilterBar()}
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
        () => this.renderEventTable(),
      )}
    `;
  }

  private renderPageHeader() {
    return html`
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-header-icon">
            <wa-icon name="calendar-days" style="font-size: 1.5rem;"></wa-icon>
          </div>
          <div class="page-header-content">
            <h2>Event Management</h2>
            <p>Create and manage store events, tournaments, and registrations</p>
          </div>
        </div>
        <wa-button variant="brand" @click="${this.openCreateDialog}">
          <wa-icon slot="start" name="plus"></wa-icon>
          Create Event
        </wa-button>
      </div>
    `;
  }

  private renderFilterBar() {
    return html`
      <div class="filter-bar">
        <wa-select
          placeholder="Status"
          .value="${this.statusFilter}"
          @change="${this.handleStatusFilterChange}"
          clearable
        >
          <wa-option value="">All Statuses</wa-option>
          <wa-option value="SCHEDULED">Scheduled</wa-option>
          <wa-option value="CANCELLED">Cancelled</wa-option>
          <wa-option value="COMPLETED">Completed</wa-option>
        </wa-select>
        <wa-select
          placeholder="Event Type"
          .value="${this.eventTypeFilter}"
          @change="${this.handleEventTypeFilterChange}"
          clearable
        >
          <wa-option value="">All Types</wa-option>
          ${Object.entries(EVENT_TYPE_LABELS).map(
            ([value, label]) => html`<wa-option value="${value}">${label}</wa-option>`,
          )}
        </wa-select>
      </div>
    `;
  }

  private renderEventTable() {
    if (this.events.length === 0) {
      return html`
        <div class="empty-state">
          <wa-icon name="calendar-xmark"></wa-icon>
          <h3>No Events Found</h3>
          <p>Create your first event to get started.</p>
        </div>
      `;
    }

    return html`
      <wa-card appearance="outline">
        <div class="table-container">
          <table class="wa-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Game</th>
                <th scope="col">Date/Time</th>
                <th scope="col">Registered / Capacity</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.events.map(
                (event) => html`
                  <tr @click="${() => this.handleEventClick(event)}">
                    <td><strong>${event.name}</strong></td>
                    <td>${formatEventType(event.eventType)}</td>
                    <td>${event.gameDisplayName ?? '—'}</td>
                    <td>${formatDateTime(event.startTime)}</td>
                    <td>${event.registrationCount}${event.capacity != null ? html` / ${event.capacity}` : nothing}</td>
                    <td>
                      <wa-badge variant="${statusVariant(event.status)}"> ${event.status} </wa-badge>
                    </td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </wa-card>
      ${this.renderPagination()}
    `;
  }

  private renderPagination() {
    if (this.totalPages <= 1) return nothing;

    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalCount);

    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.page - Math.floor(maxVisible / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return html`
      <div class="pagination">
        <span class="pagination-info">Showing ${start}-${end} of ${this.totalCount} events</span>
        <div class="pagination-controls">
          <div class="pagination-buttons">
            <wa-button
              size="small"
              variant="neutral"
              ?disabled="${this.page === 1}"
              @click="${() => this.goToPage(this.page - 1)}"
            >
              <wa-icon name="chevron-left"></wa-icon>
            </wa-button>
            ${pages.map(
              (p) => html`
                <wa-button
                  size="small"
                  variant="${p === this.page ? 'brand' : 'neutral'}"
                  @click="${() => this.goToPage(p)}"
                >
                  ${p}
                </wa-button>
              `,
            )}
            <wa-button
              size="small"
              variant="neutral"
              ?disabled="${this.page === this.totalPages}"
              @click="${() => this.goToPage(this.page + 1)}"
            >
              <wa-icon name="chevron-right"></wa-icon>
            </wa-button>
          </div>
        </div>
      </div>
    `;
  }

  // --- Detail Mode ---

  private renderDetailMode() {
    return html`
      <wa-button
        size="small"
        variant="neutral"
        appearance="outlined"
        style="margin-bottom: 1rem;"
        @click="${this.handleBackToList}"
      >
        <wa-icon slot="start" name="arrow-left"></wa-icon>
        Back to Events
      </wa-button>

      ${when(
        this.detailError,
        () => html`
          <wa-callout variant="danger" style="margin-bottom: 1rem;">
            <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
            ${this.detailError}
          </wa-callout>
        `,
      )}
      ${when(
        this.detailLoading,
        () => html`
          <div class="loading-container">
            <wa-spinner style="font-size: 2rem;"></wa-spinner>
            <span>Loading event details...</span>
          </div>
        `,
        () => (this.selectedEvent ? this.renderEventDetail() : nothing),
      )}
    `;
  }

  private renderEventDetail() {
    const ev = this.selectedEvent!;
    const activeRegistrations = this.registrations.filter((r) => r.status === 'REGISTERED');
    const checkedInCount = activeRegistrations.filter((r) => r.checkedIn).length;

    return html`
      <wa-card appearance="outline" style="margin-bottom: 1.5rem;">
        <div class="detail-header">
          <div>
            <h2 class="detail-title">${ev.name}</h2>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem;">
              <wa-badge variant="${statusVariant(ev.status)}">${ev.status}</wa-badge>
              <wa-badge variant="neutral">${formatEventType(ev.eventType)}</wa-badge>
              ${ev.isRecurrenceTemplate ? html`<wa-badge variant="brand">Recurring</wa-badge>` : nothing}
            </div>
          </div>
          <div class="detail-actions">
            ${ev.status === 'SCHEDULED'
              ? html`
                  <wa-button size="small" variant="neutral" @click="${this.openEditDialog}">
                    <wa-icon slot="start" name="pen-to-square"></wa-icon>
                    Edit
                  </wa-button>
                  <wa-button size="small" variant="danger" @click="${() => (this.showCancelEventDialog = true)}">
                    <wa-icon slot="start" name="xmark"></wa-icon>
                    Cancel Event
                  </wa-button>
                  ${ev.recurrenceGroupId
                    ? html`
                        ${ev.isRecurrenceTemplate
                          ? html`
                              <wa-button
                                size="small"
                                variant="neutral"
                                @click="${() => {
                                  this.editRecurrenceFrequency = ev.recurrenceRule?.frequency ?? '';
                                  this.editRecurrenceError = '';
                                  this.showEditRecurrenceDialog = true;
                                }}"
                              >
                                <wa-icon slot="start" name="arrows-rotate"></wa-icon>
                                Edit Recurrence
                              </wa-button>
                            `
                          : nothing}
                        <wa-button size="small" variant="danger" @click="${() => (this.showCancelSeriesDialog = true)}">
                          <wa-icon slot="start" name="xmark"></wa-icon>
                          Cancel Recurring Series
                        </wa-button>
                      `
                    : nothing}
                `
              : nothing}
          </div>
        </div>

        <div class="detail-meta">
          <div class="meta-item">
            <wa-icon name="calendar" style="font-size: 1rem;"></wa-icon>
            ${formatDateTime(ev.startTime)} ${ev.endTime ? html` &ndash; ${formatDateTime(ev.endTime)}` : nothing}
          </div>
          ${ev.gameDisplayName
            ? html`
                <div class="meta-item">
                  <wa-icon name="dice" style="font-size: 1rem;"></wa-icon>
                  ${ev.gameDisplayName}
                </div>
              `
            : nothing}
          <div class="meta-item">
            <wa-icon name="dollar-sign" style="font-size: 1rem;"></wa-icon>
            Entry: ${formatEntryFee(ev.entryFeeInCents)}
          </div>
          <div class="meta-item">
            <wa-icon name="users" style="font-size: 1rem;"></wa-icon>
            ${ev.capacity != null
              ? html`${ev.registrationCount} / ${ev.capacity} spots filled`
              : html`${ev.registrationCount} registered`}
          </div>
          ${ev.recurrenceRule
            ? html`
                <div class="meta-item">
                  <wa-icon name="arrows-rotate" style="font-size: 1rem;"></wa-icon>
                  Repeats: ${formatRecurrenceFrequency(ev.recurrenceRule.frequency)}
                </div>
              `
            : nothing}
        </div>

        ${ev.description ? html`<div class="detail-description">${ev.description}</div>` : nothing}
      </wa-card>

      <!-- Registration Stats -->
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-icon">
            <wa-icon name="users"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Registered</span>
            <span class="stat-value">${activeRegistrations.length}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <wa-icon name="user-check"></wa-icon>
          </div>
          <div class="stat-content">
            <span class="stat-label">Checked In</span>
            <span class="stat-value">${checkedInCount}</span>
          </div>
        </div>
      </div>

      <!-- Registrations -->
      <div class="section-header">
        <h3 class="section-title">Registrations</h3>
        ${ev.status === 'SCHEDULED'
          ? html`
              <wa-button
                size="small"
                variant="brand"
                @click="${() => {
                  this.regName = '';
                  this.regEmail = '';
                  this.regPhone = '';
                  this.regError = '';
                  this.showAddRegistrationDialog = true;
                }}"
              >
                <wa-icon slot="start" name="user-plus"></wa-icon>
                Add Registration
              </wa-button>
            `
          : nothing}
      </div>

      ${this.registrations.length === 0
        ? html`
            <div class="empty-state" style="padding: 2rem;">
              <wa-icon name="users" style="font-size: 2rem;"></wa-icon>
              <h3>No Registrations</h3>
              <p>No one has registered for this event yet.</p>
            </div>
          `
        : html`
            <wa-card appearance="outline">
              <div class="table-container">
                <table class="wa-table">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Status</th>
                      <th scope="col">Checked In</th>
                      <th scope="col">Registered At</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.registrations.map(
                      (reg) => html`
                        <tr style="cursor: default;">
                          <td><strong>${reg.registrantName}</strong></td>
                          <td>${reg.registrantEmail ?? '—'}</td>
                          <td>${reg.registrantPhone ?? '—'}</td>
                          <td>
                            <wa-badge variant="${reg.status === 'REGISTERED' ? 'success' : 'danger'}">
                              ${reg.status}
                            </wa-badge>
                          </td>
                          <td>
                            ${reg.checkedIn
                              ? html`<wa-badge variant="success">Yes</wa-badge> ${reg.checkedInAt
                                    ? html`<span
                                        style="font-size: var(--wa-font-size-xs); color: var(--wa-color-text-muted); margin-left: 0.25rem;"
                                        >${formatDateTime(reg.checkedInAt)}</span
                                      >`
                                    : nothing}`
                              : html`<wa-badge variant="neutral">No</wa-badge>`}
                          </td>
                          <td>${formatDateTime(reg.createdAt)}</td>
                          <td class="actions-cell">
                            <div class="actions-cell-inner">
                              ${reg.status === 'REGISTERED'
                                ? html`
                                    ${!reg.checkedIn
                                      ? html`
                                          <wa-button
                                            size="small"
                                            variant="success"
                                            @click="${() => this.handleCheckIn(reg.id)}"
                                          >
                                            <wa-icon slot="start" name="check"></wa-icon>
                                            Check In
                                          </wa-button>
                                        `
                                      : nothing}
                                    <wa-button
                                      size="small"
                                      variant="danger"
                                      @click="${() => this.handleCancelRegistration(reg.id)}"
                                    >
                                      <wa-icon slot="start" name="xmark"></wa-icon>
                                      Cancel
                                    </wa-button>
                                  `
                                : nothing}
                            </div>
                          </td>
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </div>
            </wa-card>
          `}
    `;
  }

  // --- Dialogs ---

  private renderEventDialog() {
    const isEdit = !!this.editingEvent;
    return html`
      <wa-dialog
        label="${isEdit ? 'Edit Event' : 'Create Event'}"
        ?open="${this.showEventDialog}"
        @wa-after-hide="${(e: Event) => {
          if (e.target === e.currentTarget) this.showEventDialog = false;
        }}"
        style="--width: 600px;"
      >
        <div class="dialog-form">
          ${this.dialogError
            ? html`
                <wa-callout variant="danger">
                  <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                  ${this.dialogError}
                </wa-callout>
              `
            : nothing}

          <wa-input
            label="Name"
            placeholder="Event name"
            required
            .value="${this.formName}"
            @input="${(e: Event) => (this.formName = (e.target as WaInput).value as string)}"
          ></wa-input>

          <wa-textarea
            label="Description"
            placeholder="Event description (optional)"
            .value="${this.formDescription}"
            @input="${(e: Event) => (this.formDescription = (e.target as WaTextarea).value as string)}"
            rows="3"
          ></wa-textarea>

          <div class="form-row">
            <wa-select
              label="Event Type"
              required
              .value="${this.formEventType}"
              @change="${(e: Event) => (this.formEventType = (e.target as WaSelect).value as string)}"
            >
              <wa-option value="">Select type...</wa-option>
              <wa-option value="TOURNAMENT">Tournament</wa-option>
              <wa-option value="CASUAL_PLAY">Casual Play</wa-option>
              <wa-option value="RELEASE_EVENT">Release Event</wa-option>
              <wa-option value="DRAFT">Draft</wa-option>
              <wa-option value="PRERELEASE">Prerelease</wa-option>
              <wa-option value="LEAGUE">League</wa-option>
              <wa-option value="OTHER">Other</wa-option>
            </wa-select>

            <wa-select
              label="Game"
              .value="${this.formCategoryId}"
              @change="${(e: Event) => (this.formCategoryId = (e.target as WaSelect).value as string)}"
              clearable
            >
              <wa-option value="">None</wa-option>
              ${this.supportedGames.map(
                (game) => html`<wa-option value="${game.categoryId}">${game.displayName}</wa-option>`,
              )}
            </wa-select>
          </div>

          <div class="form-row">
            <wa-input
              label="Start Date/Time"
              type="datetime-local"
              required
              .value="${this.formStartTime}"
              @input="${(e: Event) => (this.formStartTime = (e.target as WaInput).value as string)}"
            ></wa-input>

            <wa-input
              label="End Date/Time"
              type="datetime-local"
              .value="${this.formEndTime}"
              @input="${(e: Event) => (this.formEndTime = (e.target as WaInput).value as string)}"
            ></wa-input>
          </div>

          <div class="form-row">
            <wa-input
              label="Capacity"
              type="number"
              placeholder="Unlimited"
              min="1"
              .value="${this.formCapacity}"
              @input="${(e: Event) => (this.formCapacity = (e.target as WaInput).value as string)}"
            ></wa-input>

            <wa-input
              label="Entry Fee ($)"
              type="number"
              placeholder="Free"
              min="0"
              step="0.01"
              .value="${this.formEntryFee}"
              @input="${(e: Event) => (this.formEntryFee = (e.target as WaInput).value as string)}"
            ></wa-input>
          </div>

          ${!isEdit
            ? html`
                <wa-select
                  label="Recurrence"
                  .value="${this.formRecurrenceFrequency}"
                  @change="${(e: Event) => (this.formRecurrenceFrequency = (e.target as WaSelect).value as string)}"
                >
                  <wa-option value="">None</wa-option>
                  <wa-option value="WEEKLY">Weekly</wa-option>
                  <wa-option value="BIWEEKLY">Biweekly</wa-option>
                  <wa-option value="MONTHLY">Monthly</wa-option>
                </wa-select>
              `
            : nothing}
        </div>

        <wa-button slot="footer" variant="neutral" @click="${() => (this.showEventDialog = false)}">Cancel</wa-button>
        <wa-button slot="footer" variant="brand" ?loading="${this.saving}" @click="${this.handleSaveEvent}">
          <wa-icon slot="start" name="${isEdit ? 'floppy-disk' : 'plus'}"></wa-icon>
          ${isEdit ? 'Save Changes' : 'Create Event'}
        </wa-button>
      </wa-dialog>
    `;
  }

  private renderAddRegistrationDialog() {
    return html`
      <wa-dialog
        label="Add Walk-in Registration"
        ?open="${this.showAddRegistrationDialog}"
        @wa-after-hide="${(e: Event) => {
          if (e.target === e.currentTarget) this.showAddRegistrationDialog = false;
        }}"
      >
        <div class="dialog-form">
          ${this.regError
            ? html`
                <wa-callout variant="danger">
                  <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                  ${this.regError}
                </wa-callout>
              `
            : nothing}

          <wa-input
            label="Name"
            placeholder="Registrant name"
            required
            .value="${this.regName}"
            @input="${(e: Event) => (this.regName = (e.target as WaInput).value as string)}"
          ></wa-input>

          <wa-input
            label="Email"
            type="email"
            placeholder="Email address (optional)"
            .value="${this.regEmail}"
            @input="${(e: Event) => (this.regEmail = (e.target as WaInput).value as string)}"
          ></wa-input>

          <wa-input
            label="Phone"
            type="tel"
            placeholder="Phone number (optional)"
            .value="${this.regPhone}"
            @input="${(e: Event) => (this.regPhone = (e.target as WaInput).value as string)}"
          ></wa-input>
        </div>

        <wa-button slot="footer" variant="neutral" @click="${() => (this.showAddRegistrationDialog = false)}">
          Cancel
        </wa-button>
        <wa-button
          slot="footer"
          variant="brand"
          ?loading="${this.addingRegistration}"
          @click="${this.handleAddRegistration}"
        >
          <wa-icon slot="start" name="user-plus"></wa-icon>
          Add Registration
        </wa-button>
      </wa-dialog>
    `;
  }

  private renderCancelEventDialog() {
    return html`
      <wa-dialog
        label="Cancel Event"
        ?open="${this.showCancelEventDialog}"
        @wa-after-hide="${(e: Event) => {
          if (e.target === e.currentTarget) this.showCancelEventDialog = false;
        }}"
      >
        <p>
          Are you sure you want to cancel <strong>${this.selectedEvent?.name}</strong>? This action cannot be undone.
        </p>
        <wa-button slot="footer" variant="neutral" @click="${() => (this.showCancelEventDialog = false)}">
          Keep Event
        </wa-button>
        <wa-button slot="footer" variant="danger" @click="${this.handleCancelEvent}">
          <wa-icon slot="start" name="xmark"></wa-icon>
          Cancel Event
        </wa-button>
      </wa-dialog>
    `;
  }

  private renderCancelSeriesDialog() {
    return html`
      <wa-dialog
        label="Cancel Recurring Series"
        ?open="${this.showCancelSeriesDialog}"
        @wa-after-hide="${(e: Event) => {
          if (e.target === e.currentTarget) this.showCancelSeriesDialog = false;
        }}"
      >
        <p>
          Are you sure you want to cancel <strong>all future events</strong> in this recurring series? This action
          cannot be undone.
        </p>
        <wa-button slot="footer" variant="neutral" @click="${() => (this.showCancelSeriesDialog = false)}">
          Keep Series
        </wa-button>
        <wa-button slot="footer" variant="danger" @click="${this.handleCancelSeries}">
          <wa-icon slot="start" name="xmark"></wa-icon>
          Cancel Series
        </wa-button>
      </wa-dialog>
    `;
  }

  private renderEditRecurrenceDialog() {
    return html`
      <wa-dialog
        label="Edit Recurrence"
        ?open="${this.showEditRecurrenceDialog}"
        @wa-after-hide="${(e: Event) => {
          if (e.target === e.currentTarget) this.showEditRecurrenceDialog = false;
        }}"
      >
        <div class="dialog-form">
          ${this.editRecurrenceError
            ? html`
                <wa-callout variant="danger">
                  <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                  ${this.editRecurrenceError}
                </wa-callout>
              `
            : nothing}
          <p style="margin-top: 0;">
            Changing the recurrence frequency will cancel all future scheduled instances and regenerate them with the
            new frequency.
          </p>
          <wa-select
            label="Recurrence Frequency"
            .value="${this.editRecurrenceFrequency}"
            @change="${(e: Event) => (this.editRecurrenceFrequency = (e.target as WaSelect).value as string)}"
          >
            <wa-option value="WEEKLY">Weekly</wa-option>
            <wa-option value="BIWEEKLY">Biweekly</wa-option>
            <wa-option value="MONTHLY">Monthly</wa-option>
          </wa-select>
        </div>
        <wa-button slot="footer" variant="neutral" @click="${() => (this.showEditRecurrenceDialog = false)}">
          Cancel
        </wa-button>
        <wa-button
          slot="footer"
          variant="brand"
          ?loading="${this.editRecurrenceSaving}"
          @click="${this.handleUpdateRecurrenceRule}"
        >
          <wa-icon slot="start" name="floppy-disk"></wa-icon>
          Save Recurrence
        </wa-button>
      </wa-dialog>
    `;
  }
}
