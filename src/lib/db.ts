import Dexie, { type Table } from "dexie";
import { outboxMiddleware } from "./outbox-middleware";

export interface Business {
  id: string;
  name: string;
  created_at: string;
  server_updated_at: string;
}

export interface Shop {
  id: string;
  business_id: string;
  name: string;
  shop_code: string;
  momo_number: string;
  currency: string;
  active: boolean;
  server_updated_at: string;
}

export interface User {
  id: string;
  business_id: string;
  shop_id: string | null;
  name: string;
  role: "owner" | "attendant";
  pin_hash: string;
  active: boolean;
  server_updated_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  unit: string;
  sku_code: string;
  selling_price: number;
  buying_price: number;
  stock_qty: number;
  is_fast_mover: boolean;
  photo_url: string;
  active: boolean;
  server_updated_at: string;
  brand?: string;
  barcode?: string;
  reorder_level?: number;
  expiry_tracked?: boolean;
  warehouse_id?: string;
  published_online?: boolean;
}

export interface Batch {
  id: string;
  shop_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  expiry_date: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  shop_id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  business_id: string;
  from_shop_id: string;
  to_shop_id: string;
  lines: { product_id: string; quantity: number }[];
  status: "pending" | "completed";
  created_at: string;
  completed_at: string | null;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  notes: string;
  balance: number;
  server_updated_at: string;
}

export interface Shift {
  id: string;
  shop_id: string;
  user_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_float: number;
  counted_cash: number | null;
  expected_cash: number | null;
  variance: number | null;
  status: "open" | "closed";
}

export interface Sale {
  id: string;
  shop_id: string;
  shift_id: string;
  user_id: string;
  customer_id: string | null;
  created_at: string;
  status: "completed" | "voided";
  void_reason: string;
  total: number;
  note: string;
}

export interface SaleLine {
  id: string;
  sale_id: string;
  product_id: string;
  qty: number;
  unit_price: number;
  line_total: number;
  buying_price_snapshot: number;
}

export interface Tender {
  id: string;
  sale_id: string;
  method: "cash" | "mtn_momo" | "airtel_money" | "credit";
  amount: number;
  amount_tendered: number;
  change: number;
}

export interface StockMovement {
  id: string;
  shop_id: string;
  product_id: string;
  type: "sale" | "receive" | "adjust" | "void";
  qty_delta: number;
  reason: string;
  user_id: string;
  created_at: string;
  ref_id: string;
}

export interface DeniLedger {
  id: string;
  shop_id: string;
  customer_id: string;
  type: "sale_credit" | "collection" | "void";
  amount: number;
  sale_id: string;
  user_id: string;
  created_at: string;
  note: string;
}

export interface CashMovement {
  id: string;
  shop_id: string;
  shift_id: string;
  type: "draw" | "expense" | "collection_cash";
  amount: number;
  reason: string;
  user_id: string;
  created_at: string;
}

export interface Device {
  id: string;
  shop_id: string;
  token: string;
  name: string;
}

export interface OutboxItem {
  id: string;
  table: string;
  row_id: string;
  op: "insert" | "update" | "void";
  payload: string;
  created_at: string;
  synced_at: string | null;
  sequence?: number;
  batch_id?: string;
}

export interface ExpenseRecord {
  id: string;
  shop_id: string;
  category: string;
  amount: number;
  description: string;
  user_id: string;
  incurred_at: string;
}

export interface SupplierRecord {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  created_at: string;
}

export interface PurchaseItemLine {
  product_id?: string;
  name: string;
  qty: number;
  unit_cost: number;
  line_total: number;
}

export interface PurchaseRecord {
  id: string;
  shop_id: string;
  supplier_id: string | null;
  supplier_name: string;
  items: PurchaseItemLine[];
  total: number;
  paid: number;
  status: "received" | "pending";
  note: string;
  created_at: string;
}

export interface ReservedOrderLine {
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface ReservedOrderRecord {
  id: string;
  shop_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  lines: ReservedOrderLine[];
  total: number;
  deposit_ugx: number;
  status: "held" | "invoiced" | "completed" | "cancelled";
  created_at: string;
}

export interface BookingRecord {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  staff_name: string;
  scheduled_at: string;
  duration_min: number;
  deposit_ugx: number;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
}

export interface ProductionRunRecord {
  id: string;
  shop_id: string;
  product_name: string;
  batch_code: string;
  qty_produced: number;
  unit: string;
  cost_ugx: number;
  notes: string;
  created_at: string;
}

export interface StoreOrderRecord {
  id: string;
  shop_id: string;
  slug: string;
  customer_name: string;
  customer_phone: string;
  delivery_band: string;
  items: { name: string; qty: number; line_total: number }[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";
  created_at: string;
}

export class DuukaDB extends Dexie {
  businesses!: Table<Business>;
  shops!: Table<Shop>;
  users!: Table<User>;
  products!: Table<Product>;
  customers!: Table<Customer>;
  shifts!: Table<Shift>;
  sales!: Table<Sale>;
  sale_lines!: Table<SaleLine>;
  tenders!: Table<Tender>;
  stock_movements!: Table<StockMovement>;
  deni_ledger!: Table<DeniLedger>;
  cash_movements!: Table<CashMovement>;
  devices!: Table<Device>;
  outbox!: Table<OutboxItem>;
  batches!: Table<Batch>;
  warehouses!: Table<Warehouse>;
  stock_transfers!: Table<StockTransfer>;
  expenses!: Table<ExpenseRecord>;
  suppliers!: Table<SupplierRecord>;
  purchases!: Table<PurchaseRecord>;
  reserved_orders!: Table<ReservedOrderRecord>;
  bookings!: Table<BookingRecord>;
  production_runs!: Table<ProductionRunRecord>;
  store_orders!: Table<StoreOrderRecord>;

  constructor() {
    super("duuka");
    this.use({ stack: "dbcore", name: "durable-outbox", level: 2, create: outboxMiddleware });
    this.version(1).stores({
      businesses: "id",
      shops: "id, business_id, shop_code",
      users: "id, business_id, shop_id, [business_id+shop_id]",
      products: "id, shop_id, name, [shop_id+name]",
      customers: "id, shop_id, name, [shop_id+name]",
      shifts: "id, shop_id, user_id, status, [shop_id+status]",
      sales: "id, shop_id, shift_id, user_id, customer_id, status, created_at, [shop_id+created_at]",
      sale_lines: "id, sale_id, product_id",
      tenders: "id, sale_id, method",
      stock_movements: "id, shop_id, product_id, type, ref_id, created_at, [shop_id+product_id]",
      deni_ledger: "id, shop_id, customer_id, type, created_at, [shop_id+customer_id]",
      cash_movements: "id, shop_id, shift_id, type, created_at",
      devices: "id, shop_id, token",
      outbox: "id, table, row_id, created_at, synced_at",
    });
    this.version(2).stores({
      batches:
        "id, shop_id, product_id, warehouse_id, expiry_date, [shop_id+product_id]",
      warehouses: "id, shop_id, name",
      stock_transfers:
        "id, business_id, from_shop_id, to_shop_id, status, created_at",
    });
    this.version(3).stores({
      expenses: "id, shop_id, category, incurred_at, [shop_id+incurred_at]",
      suppliers: "id, shop_id, name",
      purchases: "id, shop_id, supplier_id, status, created_at",
      reserved_orders: "id, shop_id, customer_id, status, created_at",
    });
    this.version(4).stores({
      bookings: "id, shop_id, scheduled_at, status",
      production_runs: "id, shop_id, created_at",
      store_orders: "id, shop_id, status, created_at",
    });
  }
}

export const db = new DuukaDB();
