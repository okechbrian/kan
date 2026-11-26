/** Business books only. Device bearer credentials are never exported. */
export const BACKUP_TABLES = [
  "businesses", "shops", "users", "products", "customers", "shifts", "sales",
  "sale_lines", "tenders", "stock_movements", "deni_ledger", "cash_movements",
  "batches", "warehouses", "stock_transfers", "expenses", "suppliers", "purchases",
  "reserved_orders", "bookings", "production_runs", "store_orders",
] as const;
