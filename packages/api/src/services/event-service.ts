import { eq, and, gte, lte, count, desc, ne, isNotNull, inArray } from 'drizzle-orm';
import { otcgs } from '../db/otcgs/index.ts';
import { event } from '../db/otcgs/event-schema.ts';
import { eventRegistration } from '../db/otcgs/event-registration-schema.ts';
import { category } from '../db/tcg-data/schema.ts';
import { normalizePagination } from '../lib/sql-utils.ts';
import { formatDate } from '../lib/date-utils.ts';
import type { EventType, EventStatus, RegistrationStatus } from '../schema/types.generated.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventFilters {
  dateFrom?: string | null;
  dateTo?: string | null;
  eventType?: string | null;
  status?: string | null;
  categoryId?: number | null;
}

interface CreateEventInput {
  name: string;
  description?: string | null;
  eventType: string;
  categoryId?: number | null;
  startTime: string;
  endTime?: string | null;
  capacity?: number | null;
  entryFeeInCents?: number | null;
  recurrenceRule?: { frequency: string } | null;
}

interface UpdateEventInput {
  name?: string | null;
  description?: string | null;
  eventType?: string | null;
  categoryId?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  capacity?: number | null;
  entryFeeInCents?: number | null;
}

interface RegistrationInput {
  registrantName: string;
  registrantEmail?: string | null;
  registrantPhone?: string | null;
}

// Map of eventType enum values (GraphQL) to DB values
const EVENT_TYPE_MAP: Record<string, string> = {
  TOURNAMENT: 'tournament',
  CASUAL_PLAY: 'casual_play',
  RELEASE_EVENT: 'release_event',
  DRAFT: 'draft',
  PRERELEASE: 'prerelease',
  LEAGUE: 'league',
  OTHER: 'other',
};

const DB_TO_GQL_EVENT_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(EVENT_TYPE_MAP).map(([k, v]) => [v, k]),
);

const VALID_FREQUENCIES = ['weekly', 'biweekly', 'monthly'];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

async function enrichEventWithGame(e: typeof event.$inferSelect) {
  let gameName: string | null = null;
  let gameDisplayName: string | null = null;

  if (e.categoryId) {
    const [cat] = await otcgs
      .select({ name: category.name, displayName: category.displayName })
      .from(category)
      .where(eq(category.id, e.categoryId))
      .limit(1);
    if (cat) {
      gameName = cat.name;
      gameDisplayName = cat.displayName;
    }
  }

  // Get registration count
  const [regCount] = await otcgs
    .select({ count: count() })
    .from(eventRegistration)
    .where(and(eq(eventRegistration.eventId, e.id), eq(eventRegistration.status, 'registered')));

  return {
    id: e.id,
    organizationId: e.organizationId,
    name: e.name,
    description: e.description,
    eventType: (DB_TO_GQL_EVENT_TYPE[e.eventType] ?? e.eventType) as EventType,
    categoryId: e.categoryId,
    gameName,
    gameDisplayName,
    startTime: formatDate(e.startTime) ?? new Date().toISOString(),
    endTime: formatDate(e.endTime),
    capacity: e.capacity,
    entryFeeInCents: e.entryFeeInCents,
    status: e.status.toUpperCase() as EventStatus,
    registrationCount: regCount.count,
    recurrenceRule: e.recurrenceRule ? JSON.parse(e.recurrenceRule) : null,
    recurrenceGroupId: e.recurrenceGroupId,
    isRecurrenceTemplate: e.isRecurrenceTemplate ?? false,
    createdAt: formatDate(e.createdAt) ?? new Date().toISOString(),
    updatedAt: formatDate(e.updatedAt) ?? new Date().toISOString(),
  };
}

/**
 * Batch-enrich a list of events with game info and registration counts.
 * Uses two bulk queries instead of 2N queries (N+1 problem).
 */
async function enrichEventsWithGame(rows: (typeof event.$inferSelect)[]) {
  if (rows.length === 0) return [];

  const eventIds = rows.map((e) => e.id);

  // Batch-fetch registration counts for all events
  const regCounts = await otcgs
    .select({
      eventId: eventRegistration.eventId,
      count: count(),
    })
    .from(eventRegistration)
    .where(and(inArray(eventRegistration.eventId, eventIds), eq(eventRegistration.status, 'registered')))
    .groupBy(eventRegistration.eventId);

  const regCountMap = new Map(regCounts.map((r) => [r.eventId, r.count]));

  // Batch-fetch categories for all events that have a categoryId
  const categoryIds = [...new Set(rows.map((e) => e.categoryId).filter((id): id is number => id !== null))];
  const categoryMap = new Map<number, { name: string; displayName: string | null }>();

  if (categoryIds.length > 0) {
    const categories = await otcgs
      .select({ id: category.id, name: category.name, displayName: category.displayName })
      .from(category)
      .where(inArray(category.id, categoryIds));

    for (const cat of categories) {
      categoryMap.set(cat.id, { name: cat.name, displayName: cat.displayName });
    }
  }

  return rows.map((e) => {
    const cat = e.categoryId ? categoryMap.get(e.categoryId) : null;
    return {
      id: e.id,
      organizationId: e.organizationId,
      name: e.name,
      description: e.description,
      eventType: (DB_TO_GQL_EVENT_TYPE[e.eventType] ?? e.eventType) as EventType,
      categoryId: e.categoryId,
      gameName: cat?.name ?? null,
      gameDisplayName: cat?.displayName ?? null,
      startTime: formatDate(e.startTime) ?? new Date().toISOString(),
      endTime: formatDate(e.endTime),
      capacity: e.capacity,
      entryFeeInCents: e.entryFeeInCents,
      status: e.status.toUpperCase() as EventStatus,
      registrationCount: regCountMap.get(e.id) ?? 0,
      recurrenceRule: e.recurrenceRule ? JSON.parse(e.recurrenceRule) : null,
      recurrenceGroupId: e.recurrenceGroupId,
      isRecurrenceTemplate: e.isRecurrenceTemplate ?? false,
      createdAt: formatDate(e.createdAt) ?? new Date().toISOString(),
      updatedAt: formatDate(e.updatedAt) ?? new Date().toISOString(),
    };
  });
}

function formatRegistration(r: typeof eventRegistration.$inferSelect) {
  return {
    id: r.id,
    eventId: r.eventId,
    registrantName: r.registrantName,
    registrantEmail: r.registrantEmail,
    registrantPhone: r.registrantPhone,
    status: r.status.toUpperCase() as RegistrationStatus,
    checkedIn: r.checkedIn ?? false,
    checkedInAt: formatDate(r.checkedInAt),
    createdAt: formatDate(r.createdAt) ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateCreateInput(input: CreateEventInput) {
  if (!input.name?.trim()) throw new Error('Event name is required');
  const dbType = EVENT_TYPE_MAP[input.eventType];
  if (!dbType) throw new Error(`Invalid event type: ${input.eventType}`);

  const startTime = new Date(input.startTime);
  if (isNaN(startTime.getTime())) throw new Error('Invalid start time');

  if (input.endTime) {
    const endTime = new Date(input.endTime);
    if (isNaN(endTime.getTime())) throw new Error('Invalid end time');
    if (endTime <= startTime) throw new Error('End time must be after start time');
  }

  if (input.capacity !== undefined && input.capacity !== null && input.capacity < 1) {
    throw new Error('Capacity must be at least 1');
  }

  if (input.entryFeeInCents !== undefined && input.entryFeeInCents !== null && input.entryFeeInCents < 0) {
    throw new Error('Entry fee cannot be negative');
  }

  if (input.recurrenceRule) {
    if (!VALID_FREQUENCIES.includes(input.recurrenceRule.frequency)) {
      throw new Error(`Invalid recurrence frequency: ${input.recurrenceRule.frequency}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Event CRUD
// ---------------------------------------------------------------------------

export async function getEvents(
  organizationId: string,
  filters?: EventFilters | null,
  pagination?: { page?: number | null; pageSize?: number | null } | null,
) {
  const { page, pageSize, offset } = normalizePagination(pagination);

  const conditions = [eq(event.organizationId, organizationId)];

  if (filters?.dateFrom) conditions.push(gte(event.startTime, new Date(filters.dateFrom)));
  if (filters?.dateTo) conditions.push(lte(event.startTime, new Date(filters.dateTo)));
  if (filters?.eventType) {
    const dbType = EVENT_TYPE_MAP[filters.eventType] ?? filters.eventType;
    conditions.push(eq(event.eventType, dbType));
  }
  if (filters?.status) conditions.push(eq(event.status, filters.status.toLowerCase()));
  if (filters?.categoryId) conditions.push(eq(event.categoryId, filters.categoryId));

  const whereClause = and(...conditions);

  const [rows, [countResult]] = await Promise.all([
    otcgs.select().from(event).where(whereClause).orderBy(desc(event.startTime)).limit(pageSize).offset(offset),
    otcgs.select({ count: count() }).from(event).where(whereClause),
  ]);

  const totalCount = countResult.count;
  const items = await enrichEventsWithGame(rows);

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getPublicEvents(organizationId: string, dateFrom: string, dateTo: string) {
  const rows = await otcgs
    .select()
    .from(event)
    .where(
      and(
        eq(event.organizationId, organizationId),
        eq(event.status, 'scheduled'),
        gte(event.startTime, new Date(dateFrom)),
        lte(event.startTime, new Date(dateTo)),
        // Don't show template events in the public calendar unless they have a valid startTime
      ),
    )
    .orderBy(event.startTime);

  return enrichEventsWithGame(rows);
}

export async function getEvent(eventId: number, organizationId?: string | null) {
  const conditions = [eq(event.id, eventId)];
  if (organizationId) conditions.push(eq(event.organizationId, organizationId));

  const [row] = await otcgs
    .select()
    .from(event)
    .where(and(...conditions))
    .limit(1);

  if (!row) return null;
  return enrichEventWithGame(row);
}

/**
 * Get a single event for public display. Only returns scheduled (non-cancelled,
 * non-completed) events to prevent exposing internal state to anonymous users.
 */
export async function getPublicEvent(eventId: number) {
  const [row] = await otcgs
    .select()
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.status, 'scheduled')))
    .limit(1);

  if (!row) return null;
  const enriched = await enrichEventWithGame(row);

  // Include active registrations for public event detail pages
  const registrationRows = await otcgs
    .select()
    .from(eventRegistration)
    .where(and(eq(eventRegistration.eventId, eventId), eq(eventRegistration.status, 'registered')))
    .orderBy(eventRegistration.createdAt);

  return {
    ...enriched,
    registrations: registrationRows.map((r) => {
      const formatted = formatRegistration(r);
      return {
        id: formatted.id,
        eventId: formatted.eventId,
        registrantName: formatted.registrantName,
        registrantEmail: null,
        registrantPhone: null,
        status: formatted.status,
        checkedIn: formatted.checkedIn,
        checkedInAt: formatted.checkedInAt,
        createdAt: formatted.createdAt,
      };
    }),
  };
}

export async function createEvent(organizationId: string, input: CreateEventInput, userId: string) {
  validateCreateInput(input);

  const dbType = EVENT_TYPE_MAP[input.eventType]!;
  const startTime = new Date(input.startTime);
  const endTime = input.endTime ? new Date(input.endTime) : null;

  const hasRecurrence = !!input.recurrenceRule;
  const recurrenceGroupId = hasRecurrence ? crypto.randomUUID() : null;

  // Insert the main event (becomes the template if recurring)
  const [created] = await otcgs
    .insert(event)
    .values({
      organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      eventType: dbType,
      categoryId: input.categoryId ?? null,
      startTime,
      endTime,
      capacity: input.capacity ?? null,
      entryFeeInCents: input.entryFeeInCents ?? null,
      status: 'scheduled',
      recurrenceRule: input.recurrenceRule ? JSON.stringify(input.recurrenceRule) : null,
      recurrenceGroupId,
      isRecurrenceTemplate: hasRecurrence,
      createdBy: userId,
    })
    .returning();

  // If recurring, generate initial batch of instances
  if (hasRecurrence && input.recurrenceRule) {
    await generateRecurrenceInstances(created, input.recurrenceRule.frequency, 8);
  }

  return enrichEventWithGame(created);
}

export async function updateEvent(eventId: number, organizationId: string, input: UpdateEventInput, _userId: string) {
  // Validate ownership
  const [existing] = await otcgs
    .select()
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)))
    .limit(1);

  if (!existing) throw new Error('Event not found');

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined && input.name !== null) updates.name = input.name.trim();
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.eventType !== undefined && input.eventType !== null) {
    const dbType = EVENT_TYPE_MAP[input.eventType];
    if (!dbType) throw new Error(`Invalid event type: ${input.eventType}`);
    updates.eventType = dbType;
  }
  if (input.categoryId !== undefined) updates.categoryId = input.categoryId;
  if (input.startTime !== undefined && input.startTime !== null) {
    const st = new Date(input.startTime);
    if (isNaN(st.getTime())) throw new Error('Invalid start time');
    updates.startTime = st;
  }
  if (input.endTime !== undefined) updates.endTime = input.endTime ? new Date(input.endTime) : null;
  if (input.capacity !== undefined && input.capacity !== null && input.capacity < 1) {
    throw new Error('Capacity must be at least 1');
  }
  if (input.capacity !== undefined) updates.capacity = input.capacity;
  if (input.entryFeeInCents !== undefined && input.entryFeeInCents !== null && input.entryFeeInCents < 0) {
    throw new Error('Entry fee cannot be negative');
  }
  if (input.entryFeeInCents !== undefined) updates.entryFeeInCents = input.entryFeeInCents;

  const [updated] = await otcgs.update(event).set(updates).where(eq(event.id, eventId)).returning();
  return enrichEventWithGame(updated);
}

export async function cancelEvent(eventId: number, organizationId: string, _userId: string) {
  const [existing] = await otcgs
    .select()
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)))
    .limit(1);

  if (!existing) throw new Error('Event not found');
  if (existing.status === 'cancelled') throw new Error('Event is already cancelled');
  if (existing.status === 'completed') throw new Error('Cannot cancel a completed event');

  const [updated] = await otcgs
    .update(event)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(event.id, eventId))
    .returning();

  return enrichEventWithGame(updated);
}

export async function cancelRecurringSeries(
  recurrenceGroupId: string,
  organizationId: string,
  _userId: string,
): Promise<number> {
  // Clear the recurrence rule on the template (stop future generation)
  await otcgs
    .update(event)
    .set({ recurrenceRule: null, isRecurrenceTemplate: false, updatedAt: new Date() })
    .where(
      and(
        eq(event.recurrenceGroupId, recurrenceGroupId),
        eq(event.organizationId, organizationId),
        eq(event.isRecurrenceTemplate, true),
      ),
    );

  // Cancel all future scheduled instances
  const now = new Date();
  const result = await otcgs
    .update(event)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(
      and(
        eq(event.recurrenceGroupId, recurrenceGroupId),
        eq(event.organizationId, organizationId),
        eq(event.status, 'scheduled'),
        gte(event.startTime, now),
      ),
    )
    .returning();

  return result.length;
}

/**
 * Get all active recurrence templates. Used by the cron handler.
 */
export async function getRecurrenceTemplates(organizationId?: string | null) {
  const conditions = [
    eq(event.isRecurrenceTemplate, true),
    eq(event.status, 'scheduled'),
    isNotNull(event.recurrenceRule),
  ];
  if (organizationId) conditions.push(eq(event.organizationId, organizationId));

  return otcgs
    .select()
    .from(event)
    .where(and(...conditions));
}

// ---------------------------------------------------------------------------
// Registration Management
// ---------------------------------------------------------------------------

export async function getEventRegistrations(eventId: number, organizationId: string) {
  // Validate org owns the event
  const [evt] = await otcgs
    .select({ id: event.id })
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)))
    .limit(1);

  if (!evt) throw new Error('Event not found');

  const rows = await otcgs
    .select()
    .from(eventRegistration)
    .where(eq(eventRegistration.eventId, eventId))
    .orderBy(eventRegistration.createdAt);

  return rows.map(formatRegistration);
}

export async function registerForEvent(eventId: number, input: RegistrationInput) {
  if (!input.registrantName?.trim()) throw new Error('Name is required');

  // Validate event exists and is registrable
  const [evt] = await otcgs.select().from(event).where(eq(event.id, eventId)).limit(1);
  if (!evt) throw new Error('Event not found');
  if (evt.status !== 'scheduled') throw new Error('Event is not accepting registrations');
  if (evt.startTime < new Date()) throw new Error('Event has already started');

  // Use a transaction to make the capacity check + insert atomic.
  // SQLite serializes writes, so this prevents two concurrent registrations
  // from both passing the capacity check and creating an over-capacity event.
  const created = await otcgs.transaction(async (tx) => {
    if (evt.capacity) {
      const [regCount] = await tx
        .select({ count: count() })
        .from(eventRegistration)
        .where(and(eq(eventRegistration.eventId, eventId), eq(eventRegistration.status, 'registered')));

      if (regCount.count >= evt.capacity) throw new Error('Event is full');
    }

    const [row] = await tx
      .insert(eventRegistration)
      .values({
        eventId,
        registrantName: input.registrantName.trim(),
        registrantEmail: input.registrantEmail?.trim() || null,
        registrantPhone: input.registrantPhone?.trim() || null,
        status: 'registered',
        createdBy: null, // anonymous registration
      })
      .returning();

    return row;
  });

  return formatRegistration(created);
}

export async function addRegistration(
  eventId: number,
  organizationId: string,
  input: RegistrationInput,
  userId: string,
) {
  if (!input.registrantName?.trim()) throw new Error('Name is required');

  // Validate org owns the event
  const [evt] = await otcgs
    .select()
    .from(event)
    .where(and(eq(event.id, eventId), eq(event.organizationId, organizationId)))
    .limit(1);

  if (!evt) throw new Error('Event not found');

  // Use a transaction to make the capacity check + insert atomic
  const created = await otcgs.transaction(async (tx) => {
    if (evt.capacity) {
      const [regCount] = await tx
        .select({ count: count() })
        .from(eventRegistration)
        .where(and(eq(eventRegistration.eventId, eventId), eq(eventRegistration.status, 'registered')));

      if (regCount.count >= evt.capacity) throw new Error('Event is full');
    }

    const [row] = await tx
      .insert(eventRegistration)
      .values({
        eventId,
        registrantName: input.registrantName.trim(),
        registrantEmail: input.registrantEmail?.trim() || null,
        registrantPhone: input.registrantPhone?.trim() || null,
        status: 'registered',
        createdBy: userId,
      })
      .returning();

    return row;
  });

  return formatRegistration(created);
}

export async function cancelRegistration(registrationId: number, organizationId: string, _userId: string) {
  // Validate org owns the event via join
  const [reg] = await otcgs
    .select({
      registration: eventRegistration,
      organizationId: event.organizationId,
    })
    .from(eventRegistration)
    .innerJoin(event, eq(eventRegistration.eventId, event.id))
    .where(and(eq(eventRegistration.id, registrationId), eq(event.organizationId, organizationId)))
    .limit(1);

  if (!reg) throw new Error('Registration not found');
  if (reg.registration.status === 'cancelled') throw new Error('Registration is already cancelled');

  const [updated] = await otcgs
    .update(eventRegistration)
    .set({ status: 'cancelled' })
    .where(eq(eventRegistration.id, registrationId))
    .returning();

  return formatRegistration(updated);
}

export async function checkInRegistration(registrationId: number, organizationId: string, _userId: string) {
  // Validate org owns the event
  const [reg] = await otcgs
    .select({
      registration: eventRegistration,
      organizationId: event.organizationId,
    })
    .from(eventRegistration)
    .innerJoin(event, eq(eventRegistration.eventId, event.id))
    .where(and(eq(eventRegistration.id, registrationId), eq(event.organizationId, organizationId)))
    .limit(1);

  if (!reg) throw new Error('Registration not found');
  if (reg.registration.status === 'cancelled') throw new Error('Cannot check in a cancelled registration');

  const [updated] = await otcgs
    .update(eventRegistration)
    .set({ checkedIn: true, checkedInAt: new Date() })
    .where(eq(eventRegistration.id, registrationId))
    .returning();

  return formatRegistration(updated);
}

// ---------------------------------------------------------------------------
// Recurrence generation
// ---------------------------------------------------------------------------

const FREQUENCY_MS: Record<string, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  biweekly: 14 * 24 * 60 * 60 * 1000,
};

/**
 * Advance a date by the given frequency. For weekly/biweekly, uses fixed ms offsets.
 * For monthly, uses calendar-aware month addition to avoid drift (e.g., 15th stays 15th).
 */
function advanceByFrequency(date: Date, frequency: string): Date {
  if (frequency === 'monthly') {
    const next = new Date(date);
    const targetMonth = next.getMonth() + 1;
    next.setMonth(targetMonth);
    // Clamp: if setMonth overflowed into the next month (e.g., Jan 31 → Mar 3),
    // roll back to the last day of the target month
    if (next.getMonth() !== targetMonth % 12) {
      next.setDate(0); // Sets to last day of previous month
    }
    return next;
  }
  const ms = FREQUENCY_MS[frequency];
  if (!ms) return date;
  return new Date(date.getTime() + ms);
}

/**
 * Generate recurring event instances from a template event up to `windowWeeks` in the future.
 */
export async function generateRecurrenceInstances(
  templateEvent: typeof event.$inferSelect,
  frequency: string,
  windowWeeks: number,
): Promise<number> {
  if (!FREQUENCY_MS[frequency] && frequency !== 'monthly') return 0;
  if (!templateEvent.recurrenceGroupId) return 0;

  const windowEnd = new Date(Date.now() + windowWeeks * 7 * 24 * 60 * 60 * 1000);

  // Find the latest existing instance in this recurrence group
  const [latest] = await otcgs
    .select({ startTime: event.startTime })
    .from(event)
    .where(and(eq(event.recurrenceGroupId, templateEvent.recurrenceGroupId), ne(event.id, templateEvent.id)))
    .orderBy(desc(event.startTime))
    .limit(1);

  // Start generating from after the latest instance (or the template itself)
  let nextTime = advanceByFrequency(latest?.startTime ?? templateEvent.startTime, frequency);

  const endTimeOffset = templateEvent.endTime
    ? templateEvent.endTime.getTime() - templateEvent.startTime.getTime()
    : null;

  const instances: (typeof event.$inferInsert)[] = [];

  while (nextTime <= windowEnd) {
    instances.push({
      organizationId: templateEvent.organizationId,
      name: templateEvent.name,
      description: templateEvent.description,
      eventType: templateEvent.eventType,
      categoryId: templateEvent.categoryId,
      startTime: new Date(nextTime),
      endTime: endTimeOffset ? new Date(nextTime.getTime() + endTimeOffset) : null,
      capacity: templateEvent.capacity,
      entryFeeInCents: templateEvent.entryFeeInCents,
      status: 'scheduled',
      recurrenceRule: null, // Only the template has the rule
      recurrenceGroupId: templateEvent.recurrenceGroupId,
      isRecurrenceTemplate: false,
      createdBy: templateEvent.createdBy,
    });

    nextTime = advanceByFrequency(nextTime, frequency);
  }

  if (instances.length > 0) {
    await otcgs.insert(event).values(instances);
  }

  return instances.length;
}
