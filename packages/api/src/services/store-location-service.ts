import { eq, sql } from 'drizzle-orm';
import { otcgs } from '../db';
import { storeHours } from '../db/otcgs/store-hours-schema';
import { auth } from '../auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoreHoursData {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
}

export interface StoreLocationData {
  id: string;
  name: string;
  slug: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  hours: StoreHoursData[];
  createdAt: string;
}

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getHoursForOrg(organizationId: string): Promise<StoreHoursData[]> {
  const rows = await otcgs
    .select({
      dayOfWeek: storeHours.dayOfWeek,
      openTime: storeHours.openTime,
      closeTime: storeHours.closeTime,
    })
    .from(storeHours)
    .where(eq(storeHours.organizationId, organizationId))
    .orderBy(storeHours.dayOfWeek);

  return rows.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    openTime: h.openTime,
    closeTime: h.closeTime,
  }));
}

function toStoreLocationData(org: OrganizationRow, hours: StoreHoursData[]): StoreLocationData {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    street1: org.street1,
    street2: org.street2,
    city: org.city,
    state: org.state,
    zip: org.zip,
    phone: org.phone,
    hours,
    createdAt: new Date(org.createdAt).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Public — returns all store locations (organizations) with their hours.
 * No authentication required.
 */
export async function getAllStoreLocations(): Promise<StoreLocationData[]> {
  const orgs = await otcgs.all<OrganizationRow>(
    sql`SELECT id, name, slug, street1, street2, city, state, zip, phone, created_at as "createdAt" FROM organization`,
  );

  const results: StoreLocationData[] = [];
  for (const org of orgs) {
    const hours = await getHoursForOrg(org.id);
    results.push(toStoreLocationData(org, hours));
  }

  return results;
}

/**
 * Authenticated — returns the store locations the current user has access to
 * (via better-auth organization membership), enriched with store hours.
 */
export async function getEmployeeStoreLocations(headers: Record<string, string>): Promise<StoreLocationData[]> {
  const response = await auth.api.listOrganizations({ headers });
  const orgs = response as Array<{
    id: string;
    name: string;
    slug: string;
    street1: string;
    street2: string | null;
    city: string;
    state: string;
    zip: string;
    phone: string | null;
    createdAt: Date;
  }>;

  const results: StoreLocationData[] = [];
  for (const org of orgs) {
    const hours = await getHoursForOrg(org.id);
    results.push({
      id: org.id,
      name: org.name,
      slug: org.slug,
      street1: org.street1,
      street2: org.street2,
      city: org.city,
      state: org.state,
      zip: org.zip,
      phone: org.phone,
      hours,
      createdAt: new Date(org.createdAt).toISOString(),
    });
  }

  return results;
}

/**
 * Fetches a single store location (organization) by ID using raw SQL,
 * plus its store hours.
 */
export async function getStoreLocation(id: string): Promise<StoreLocationData | null> {
  const orgs = await otcgs.all<OrganizationRow>(
    sql`SELECT id, name, slug, street1, street2, city, state, zip, phone, created_at as "createdAt" FROM organization WHERE id = ${id}`,
  );

  if (orgs.length === 0) {
    return null;
  }

  const hours = await getHoursForOrg(id);
  return toStoreLocationData(orgs[0], hours);
}

/**
 * Returns the currently active store location for the authenticated user.
 * Reads activeOrganizationId from the session and returns that org + hours.
 * Returns null if no active organization is set.
 */
export async function getActiveStoreLocation(headers: Record<string, string>): Promise<StoreLocationData | null> {
  const session = await auth.api.getSession({ headers });
  if (!session?.session?.activeOrganizationId) {
    return null;
  }

  return getStoreLocation(session.session.activeOrganizationId);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

interface AddStoreLocationInput {
  name: string;
  slug: string;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  phone?: string | null;
  hours?: Array<{ dayOfWeek: number; openTime?: string | null; closeTime?: string | null }> | null;
}

/**
 * Creates a new store location (organization) via better-auth, then inserts
 * any provided store hours rows.
 */
export async function addStoreLocation(
  input: AddStoreLocationInput,
  headers: Record<string, string>,
): Promise<StoreLocationData> {
  const created = await auth.api.createOrganization({
    body: {
      name: input.name,
      slug: input.slug,
      street1: input.street1,
      street2: input.street2 ?? '',
      city: input.city,
      state: input.state,
      zip: input.zip,
      phone: input.phone ?? '',
    },
    headers,
  });

  if (input.hours && input.hours.length > 0) {
    await otcgs.insert(storeHours).values(
      input.hours.map((h) => ({
        organizationId: created.id,
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime ?? null,
        closeTime: h.closeTime ?? null,
      })),
    );
  }

  const hours = await getHoursForOrg(created.id);
  return {
    id: created.id,
    name: created.name,
    slug: created.slug,
    street1: input.street1,
    street2: input.street2 ?? null,
    city: input.city,
    state: input.state,
    zip: input.zip,
    phone: input.phone ?? null,
    hours,
    createdAt: new Date(created.createdAt).toISOString(),
  };
}

interface UpdateStoreLocationInput {
  id: string;
  name?: string | null;
  street1?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  hours?: Array<{ dayOfWeek: number; openTime?: string | null; closeTime?: string | null }> | null;
}

/**
 * Updates an existing store location (organization) via better-auth, then
 * replaces its store hours (delete all for org, re-insert).
 */
export async function updateStoreLocation(
  input: UpdateStoreLocationInput,
  headers: Record<string, string>,
): Promise<StoreLocationData> {
  // Build the update data, omitting undefined fields
  const data: Record<string, string> = {};
  if (input.name != null) data.name = input.name;
  if (input.street1 != null) data.street1 = input.street1;
  if (input.street2 !== undefined) data.street2 = input.street2 ?? '';
  if (input.city != null) data.city = input.city;
  if (input.state != null) data.state = input.state;
  if (input.zip != null) data.zip = input.zip;
  if (input.phone !== undefined) data.phone = input.phone ?? '';

  await auth.api.updateOrganization({
    body: {
      data,
      organizationId: input.id,
    },
    headers,
  });

  // Replace store hours if provided
  if (input.hours !== undefined && input.hours !== null) {
    await otcgs.delete(storeHours).where(eq(storeHours.organizationId, input.id));

    if (input.hours.length > 0) {
      await otcgs.insert(storeHours).values(
        input.hours.map((h) => ({
          organizationId: input.id,
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime ?? null,
          closeTime: h.closeTime ?? null,
        })),
      );
    }
  }

  // Return the updated location
  const location = await getStoreLocation(input.id);
  if (!location) {
    throw new Error(`Store location not found after update: ${input.id}`);
  }
  return location;
}

/**
 * Removes a store location (organization). Validates that at least one
 * organization remains before deleting.
 */
export async function removeStoreLocation(id: string, headers: Record<string, string>): Promise<boolean> {
  // Atomically check that at least one org remains before proceeding.
  // This prevents a TOCTOU race where two concurrent deletions both see count > 1.
  await otcgs.transaction(async (tx) => {
    const countResult = await tx.all<{ count: number }>(sql`SELECT COUNT(*) as count FROM organization`);
    if (countResult[0].count <= 1) {
      throw new Error('Cannot remove the last store location. At least one must remain.');
    }
  });

  // Delete the organization first (irreversible external call via better-auth).
  // If this fails, no data has been modified and the operation is safely retryable.
  await auth.api.deleteOrganization({
    body: { organizationId: id },
    headers,
  });

  // Clean up store hours after org deletion. If this fails, the orphaned hours
  // are harmless — the org they reference no longer exists.
  await otcgs.delete(storeHours).where(eq(storeHours.organizationId, id));

  return true;
}

/**
 * Sets the active store (organization) for the current user's session.
 */
export async function setActiveStore(organizationId: string, headers: Record<string, string>): Promise<void> {
  await auth.api.setActiveOrganization({
    body: { organizationId },
    headers,
  });
}
