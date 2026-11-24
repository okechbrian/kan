export type Batch = {
  id: string;
  productId: string;
  quantity: number;
  expiryDate: string | null;
  warehouseId?: string;
};

export type StockMovement = {
  qty_delta: number;
};

export type ExpiryStatus = "no_expiry" | "expired" | "expiring" | "ok";

const DAY_MS = 24 * 60 * 60 * 1000;

export function expiryStatus(
  expiryDate: string | null,
  today: Date = new Date(),
  soonDays = 30
): ExpiryStatus {
  if (!expiryDate) return "no_expiry";
  const expiry = new Date(`${expiryDate}T00:00:00Z`);
  if (Number.isNaN(expiry.getTime())) return "no_expiry";
  const days = Math.floor((expiry.getTime() - today.getTime()) / DAY_MS);
  if (days < 0) return "expired";
  if (days <= soonDays) return "expiring";
  return "ok";
}

export type Allocation = { batchId: string; quantity: number };

export function fifoAllocate(batches: Batch[], requested: number): {
  allocations: Allocation[];
  shortfall: number;
} {
  if (!Number.isInteger(requested) || requested < 0) {
    throw new Error("invalid_quantity");
  }
  const sorted = [...batches].sort((a, b) => {
    if (!a.expiryDate) return 1;
    if (!b.expiryDate) return -1;
    return a.expiryDate.localeCompare(b.expiryDate);
  });
  let remaining = requested;
  const allocations: Allocation[] = [];
  for (const batch of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(batch.quantity, remaining);
    if (take > 0) {
      allocations.push({ batchId: batch.id, quantity: take });
      remaining -= take;
    }
  }
  return { allocations, shortfall: remaining };
}

export function stockFromMovements(opening: number, movements: StockMovement[]) {
  return movements.reduce((total, movement) => total + movement.qty_delta, opening);
}

export type TransferLine = { productId: string; quantity: number };

export function validateTransfer(input: {
  fromShopId: string;
  toShopId: string;
  lines: TransferLine[];
}): string | null {
  if (!input.fromShopId || !input.toShopId) return "missing_shop";
  if (input.fromShopId === input.toShopId) return "same_shop";
  if (!Array.isArray(input.lines) || input.lines.length === 0) return "empty_lines";
  const seen = new Set<string>();
  for (const line of input.lines) {
    if (!line.productId) return "missing_product";
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) return "invalid_quantity";
    if (seen.has(line.productId)) return "duplicate_product";
    seen.add(line.productId);
  }
  return null;
}

export function applyTransfer(
  fromStock: Map<string, number>,
  toStock: Map<string, number>,
  lines: TransferLine[],
  allowNegative = true
): { from: Map<string, number>; to: Map<string, number>; warnings: string[] } {
  const warnings: string[] = [];
  const from = new Map(fromStock);
  const to = new Map(toStock);
  for (const line of lines) {
    const current = from.get(line.productId) ?? 0;
    const next = current - line.quantity;
    if (next < 0 && !allowNegative) {
      throw new Error("insufficient_stock");
    }
    if (next < 0) warnings.push(`${line.productId}: stock will be negative`);
    from.set(line.productId, next);
    to.set(line.productId, (to.get(line.productId) ?? 0) + line.quantity);
  }
  return { from, to, warnings };
}
