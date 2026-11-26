/** Pure sync rules (no Dexie, no Prisma) so tests can hit the spec. */
import { SYNC_TABLE_SET } from "./sync-tables";

export const APPEND_TABLES = new Set([
  "sales",
  "sale_lines",
  "tenders",
  "stock_movements",
  "deni_ledger",
  "cash_movements",
]);

export const CATALOG_TABLES = new Set([
  "products",
  "customers",
  "users",
  "shops",
]);

export type Mutation = {
  table: string;
  row_id: string;
  op: "insert" | "update" | "void";
  payload: Record<string, unknown>;
};

export type Store = Record<string, Map<string, Record<string, unknown>>>;

export function emptyStore(): Store {
  return {
    sales: new Map(),
    sale_lines: new Map(),
    tenders: new Map(),
    stock_movements: new Map(),
    deni_ledger: new Map(),
    cash_movements: new Map(),
    products: new Map(),
    customers: new Map(),
    users: new Map(),
    shifts: new Map(),
  };
}

/** First-write-wins for append-only; LWW for catalog. Never copy stock_qty. */
export function applyMutation(store: Store, m: Mutation): boolean {
  if (!SYNC_TABLE_SET.has(m.table)) return false;
  if (!store[m.table]) store[m.table] = new Map();
  const table = store[m.table];
  const payload: Record<string, unknown> = { ...m.payload, id: m.row_id };
  if (m.table === "products") {
    delete payload.stock_qty;
  }

  if (m.op === "void" && m.table === "sales") {
    const existing = table.get(m.row_id);
    if (!existing) return false;
    table.set(m.row_id, {
      ...existing,
      status: "voided",
      void_reason: (payload.void_reason as string) ?? "",
    });
    return true;
  }

  if (APPEND_TABLES.has(m.table)) {
    if (table.has(m.row_id)) return false;
    table.set(m.row_id, payload);
    return true;
  }

  table.set(m.row_id, { ...(table.get(m.row_id) ?? {}), ...payload });
  return true;
}

export function qtyFromMovements(
  movements: { product_id: string; qty_delta: number }[]
): Map<string, number> {
  const qty = new Map<string, number>();
  for (const m of movements) {
    qty.set(m.product_id, (qty.get(m.product_id) ?? 0) + m.qty_delta);
  }
  return qty;
}

export const PRISMA_DELEGATE: Record<string, string> = {
  products: "product",
  customers: "customer",
  users: "user",
  shops: "shop",
  shifts: "shift",
  sales: "sale",
  sale_lines: "saleLine",
  tenders: "tender",
  stock_movements: "stockMovement",
  deni_ledger: "deniLedger",
  cash_movements: "cashMovement",
};
