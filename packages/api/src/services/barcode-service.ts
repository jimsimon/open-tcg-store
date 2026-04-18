import { and, eq, sql, inArray, isNull, gt } from 'drizzle-orm';
import { otcgs, barcode, inventoryItem, inventoryItemStock } from '../db';
import { product, group, category } from '../db/tcg-data/schema';
import { logTransaction } from './transaction-log-service';
import { safeISOString } from '../lib/date-utils';
import type { CardCondition } from '../schema/types.generated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BarcodeLookupResult {
  inventoryItemId: number;
  productId: number;
  productName: string;
  gameName: string;
  setName: string;
  condition: CardCondition;
  price: number;
  availableQuantity: number;
  imageUrl: string | null;
}

export interface BarcodeResult {
  id: number;
  code: string;
  inventoryItemId: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// lookupBarcode — resolve a barcode to an inventory item with stock info
// ---------------------------------------------------------------------------

export async function lookupBarcode(organizationId: string, code: string): Promise<BarcodeLookupResult | null> {
  const trimmed = code?.trim();
  if (!trimmed) return null;

  const rows = await otcgs
    .select({
      inventoryItemId: inventoryItem.id,
      productId: product.id,
      productName: product.name,
      gameName: category.displayName,
      setName: group.name,
      condition: inventoryItem.condition,
      price: inventoryItem.price,
      imageUrl: product.imageUrl,
    })
    .from(barcode)
    .innerJoin(inventoryItem, eq(barcode.inventoryItemId, inventoryItem.id))
    .innerJoin(product, eq(inventoryItem.productId, product.id))
    .innerJoin(group, eq(product.groupId, group.id))
    .innerJoin(category, eq(product.categoryId, category.id))
    .where(and(eq(barcode.organizationId, organizationId), eq(barcode.code, trimmed)))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];

  // Get available quantity (sum of non-deleted stock entries)
  const [stockResult] = await otcgs
    .select({
      total: sql<number>`COALESCE(SUM(${inventoryItemStock.quantity}), 0)`.as('total'),
    })
    .from(inventoryItemStock)
    .where(
      and(
        eq(inventoryItemStock.inventoryItemId, row.inventoryItemId),
        isNull(inventoryItemStock.deletedAt),
        gt(inventoryItemStock.quantity, 0),
      ),
    );

  return {
    inventoryItemId: row.inventoryItemId,
    productId: row.productId,
    productName: row.productName,
    gameName: row.gameName,
    setName: row.setName,
    condition: row.condition as CardCondition,
    price: row.price,
    availableQuantity: stockResult?.total ?? 0,
    imageUrl: row.imageUrl,
  };
}

// ---------------------------------------------------------------------------
// getBarcodesForInventoryItem
// ---------------------------------------------------------------------------

export async function getBarcodesForInventoryItem(
  organizationId: string,
  inventoryItemId: number,
): Promise<BarcodeResult[]> {
  const rows = await otcgs
    .select({
      id: barcode.id,
      code: barcode.code,
      inventoryItemId: barcode.inventoryItemId,
      createdAt: barcode.createdAt,
    })
    .from(barcode)
    .where(and(eq(barcode.organizationId, organizationId), eq(barcode.inventoryItemId, inventoryItemId)));

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    inventoryItemId: r.inventoryItemId,
    createdAt: safeISOString(r.createdAt) ?? new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// addBarcode — associate a barcode with an inventory item
// ---------------------------------------------------------------------------

export async function addBarcode(
  organizationId: string,
  inventoryItemId: number,
  code: string,
  userId: string,
): Promise<BarcodeResult> {
  const trimmedCode = code?.trim();
  if (!trimmedCode) {
    throw new Error('Barcode code is required');
  }

  // Wrap validation + insert in a transaction to prevent TOCTOU race conditions
  const inserted = await otcgs.transaction(async (tx) => {
    // Validate inventory item belongs to org
    const [item] = await tx
      .select({ id: inventoryItem.id })
      .from(inventoryItem)
      .where(and(eq(inventoryItem.id, inventoryItemId), eq(inventoryItem.organizationId, organizationId)))
      .limit(1);

    if (!item) {
      throw new Error('Inventory item not found');
    }

    // Check for duplicate within org
    const [existing] = await tx
      .select({ id: barcode.id })
      .from(barcode)
      .where(and(eq(barcode.organizationId, organizationId), eq(barcode.code, trimmedCode)))
      .limit(1);

    if (existing) {
      throw new Error(`Barcode "${trimmedCode}" is already in use`);
    }

    const [row] = await tx
      .insert(barcode)
      .values({
        organizationId,
        inventoryItemId,
        code: trimmedCode,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return row;
  });

  // Log transaction (best-effort, outside DB transaction)
  await logTransaction({
    organizationId,
    userId,
    action: 'barcode.added',
    resourceType: 'inventory',
    resourceId: inventoryItemId,
    details: { code: trimmedCode, inventoryItemId },
  });

  return {
    id: inserted.id,
    code: inserted.code,
    inventoryItemId: inserted.inventoryItemId,
    createdAt: safeISOString(inserted.createdAt) ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// addBarcodes — bulk add barcodes (used during inventory item creation)
// ---------------------------------------------------------------------------

export async function addBarcodes(
  organizationId: string,
  inventoryItemId: number,
  codes: string[],
  userId: string,
): Promise<BarcodeResult[]> {
  if (!codes || codes.length === 0) return [];

  const trimmedCodes = codes.map((c) => c.trim()).filter((c) => c.length > 0);
  if (trimmedCodes.length === 0) return [];

  // Wrap duplicate check + insert in a transaction to prevent TOCTOU race conditions
  const inserted = await otcgs.transaction(async (tx) => {
    const existing = await tx
      .select({ code: barcode.code })
      .from(barcode)
      .where(and(eq(barcode.organizationId, organizationId), inArray(barcode.code, trimmedCodes)));

    if (existing.length > 0) {
      const dupes = existing.map((e) => e.code).join(', ');
      throw new Error(`Barcode(s) already in use: ${dupes}`);
    }

    const values = trimmedCodes.map((code) => ({
      organizationId,
      inventoryItemId,
      code,
      createdBy: userId,
      updatedBy: userId,
    }));

    return await tx.insert(barcode).values(values).returning();
  });

  return inserted.map((r) => ({
    id: r.id,
    code: r.code,
    inventoryItemId: r.inventoryItemId,
    createdAt: safeISOString(r.createdAt) ?? new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// removeBarcode
// ---------------------------------------------------------------------------

export async function removeBarcode(organizationId: string, barcodeId: number, userId: string): Promise<boolean> {
  const [existing] = await otcgs
    .select({ id: barcode.id, code: barcode.code, inventoryItemId: barcode.inventoryItemId })
    .from(barcode)
    .where(and(eq(barcode.id, barcodeId), eq(barcode.organizationId, organizationId)))
    .limit(1);

  if (!existing) {
    throw new Error('Barcode not found');
  }

  await otcgs.delete(barcode).where(eq(barcode.id, barcodeId));

  // Log transaction (best-effort)
  await logTransaction({
    organizationId,
    userId,
    action: 'barcode.removed',
    resourceType: 'inventory',
    resourceId: existing.inventoryItemId,
    details: { code: existing.code, barcodeId },
  });

  return true;
}
