import type { CardCondition } from '../schema/types.generated';

/**
 * Generate a unique order number in the format ORD-YYYYMMDD-XXXX.
 * Shared between the cart-based order service and POS service.
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `ORD-${datePart}-${randomPart}`;
}

// ---------------------------------------------------------------------------
// Shared order item mapping and totals
// ---------------------------------------------------------------------------

export interface OrderItemResult {
  id: number;
  productId: number;
  productName: string;
  condition: CardCondition;
  quantity: number;
  unitPrice: number;
  costBasis: number | null;
  profit: number | null;
  lotId: number | null;
}

/**
 * Map raw order item rows to the GraphQL-compatible result shape,
 * computing per-item profit from revenue and cost basis.
 */
export function mapOrderItems(
  items: {
    id: number;
    productId: number;
    productName: string;
    condition: string;
    quantity: number;
    unitPrice: number;
    costBasis: number | null;
    lotId?: number | null;
  }[],
): OrderItemResult[] {
  return items.map((oi) => {
    const revenue = oi.unitPrice * oi.quantity;
    const cost = oi.costBasis != null ? oi.costBasis * oi.quantity : null;
    const profit = cost != null ? revenue - cost : null;
    return {
      id: oi.id,
      productId: oi.productId,
      productName: oi.productName,
      condition: oi.condition as CardCondition,
      quantity: oi.quantity,
      unitPrice: oi.unitPrice,
      costBasis: oi.costBasis,
      profit,
      lotId: oi.lotId ?? null,
    };
  });
}

/**
 * Compute aggregate cost basis and profit across all order items.
 * Returns null for both if no items have a cost basis.
 */
export function calculateOrderTotals(items: OrderItemResult[]) {
  let totalCostBasis: number | null = 0;
  let totalProfit: number | null = 0;
  let hasAnyCostBasis = false;

  for (const item of items) {
    if (item.costBasis != null) {
      hasAnyCostBasis = true;
      totalCostBasis = (totalCostBasis ?? 0) + item.costBasis * item.quantity;
      totalProfit = (totalProfit ?? 0) + (item.profit ?? 0);
    }
  }

  return {
    totalCostBasis: hasAnyCostBasis ? totalCostBasis : null,
    totalProfit: hasAnyCostBasis ? totalProfit : null,
  };
}
