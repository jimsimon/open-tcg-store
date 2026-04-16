import { and, eq, sql, like, or, desc } from 'drizzle-orm';
import { otcgs, transactionLog } from '../db';
import { user } from '../db/otcgs/auth-schema';
import { safeISOString } from '../lib/date-utils';
import type { ResourceType } from '../schema/types.generated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LogTransactionParams {
  organizationId: string;
  userId: string;
  action: string;
  resourceType: ResourceType;
  resourceId?: string | number | null;
  details: Record<string, unknown>;
}

interface TransactionLogEntry {
  id: number;
  action: string;
  resourceType: ResourceType;
  resourceId: string | null;
  details: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

interface TransactionLogPage {
  items: TransactionLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface TransactionLogFilters {
  month?: number | null;
  year?: number | null;
  searchTerm?: string | null;
  action?: string | null;
  resourceType?: string | null;
}

// ---------------------------------------------------------------------------
// logTransaction — fire-and-forget internal logging
// ---------------------------------------------------------------------------

export async function logTransaction(params: LogTransactionParams): Promise<void> {
  try {
    await otcgs.insert(transactionLog).values({
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId != null ? String(params.resourceId) : null,
      details: JSON.stringify(params.details),
      createdAt: new Date(),
    });
  } catch (err) {
    // Transaction logging should never break the primary operation
    console.error('Failed to log transaction:', err);
  }
}

// ---------------------------------------------------------------------------
// getTransactionLogs — paginated read query
// ---------------------------------------------------------------------------

export async function getTransactionLogs(
  organizationId: string,
  filters?: TransactionLogFilters | null,
  pagination?: { page?: number; pageSize?: number } | null,
): Promise<TransactionLogPage> {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions: ReturnType<typeof eq>[] = [eq(transactionLog.organizationId, organizationId)];

  if (filters?.resourceType) {
    conditions.push(eq(transactionLog.resourceType, filters.resourceType));
  }

  if (filters?.action) {
    conditions.push(eq(transactionLog.action, filters.action));
  }

  if (filters?.searchTerm) {
    const term = `%${filters.searchTerm}%`;
    conditions.push(or(like(transactionLog.details, term), like(transactionLog.action, term))!);
  }

  // Month/year filtering using SQLite strftime on the unix timestamp
  if (filters?.month != null && filters?.year != null) {
    conditions.push(sql`CAST(strftime('%m', ${transactionLog.createdAt}, 'unixepoch') AS INTEGER) = ${filters.month}`);
    conditions.push(sql`CAST(strftime('%Y', ${transactionLog.createdAt}, 'unixepoch') AS INTEGER) = ${filters.year}`);
  } else if (filters?.year != null) {
    conditions.push(sql`CAST(strftime('%Y', ${transactionLog.createdAt}, 'unixepoch') AS INTEGER) = ${filters.year}`);
  } else if (filters?.month != null) {
    conditions.push(sql`CAST(strftime('%m', ${transactionLog.createdAt}, 'unixepoch') AS INTEGER) = ${filters.month}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count query
  const countQuery = otcgs.select({ total: sql<number>`count(*)` }).from(transactionLog);
  const [countResult] = whereClause ? await countQuery.where(whereClause) : await countQuery;
  const totalCount = countResult?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Data query with user join
  const rows = await otcgs
    .select({
      id: transactionLog.id,
      action: transactionLog.action,
      resourceType: transactionLog.resourceType,
      resourceId: transactionLog.resourceId,
      details: transactionLog.details,
      createdAt: transactionLog.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(transactionLog)
    .innerJoin(user, eq(transactionLog.userId, user.id))
    .where(whereClause)
    .orderBy(desc(transactionLog.createdAt))
    .limit(pageSize)
    .offset(offset);

  const items: TransactionLogEntry[] = rows.map((r) => ({
    id: r.id,
    action: r.action,
    resourceType: r.resourceType as ResourceType,
    resourceId: r.resourceId,
    details: r.details,
    userName: r.userName ?? '',
    userEmail: r.userEmail ?? '',
    createdAt: safeISOString(r.createdAt),
  }));

  return { items, totalCount, page, pageSize, totalPages };
}
