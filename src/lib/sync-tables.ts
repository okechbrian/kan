/** Explicit protocol allowlist. Credentials and tenant creation never pass through sync. */
export const SYNC_TABLES = [
  "shops", "users", "warehouses", "products", "customers", "batches", "shifts", "sales", "sale_lines",
  "tenders", "stock_movements", "deni_ledger", "cash_movements", "expenses",
] as const;
export const SYNC_TABLE_SET = new Set<string>(SYNC_TABLES);

/** Pull/restore must not echo cloud rows back into the outbox. Transaction-local only. */
export const REMOTE_TRANSACTION = "kanRemoteTransaction";
