import { Prisma, type PrismaClient } from "@prisma/client";
import { SYNC_TABLES, SYNC_TABLE_SET } from "./sync-tables";

export class SyncError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const DELEGATES: Record<string, string> = {
  shops: "shop", users: "user", products: "product", customers: "customer", shifts: "shift",
  sales: "sale", sale_lines: "saleLine", tenders: "tender", stock_movements: "stockMovement",
  deni_ledger: "deniLedger", cash_movements: "cashMovement",
  expenses: "expense", warehouses: "warehouse", batches: "batch",
};
type Identity = { shopId: string; businessId: string };
type Tx = Prisma.TransactionClient;
// Prisma's generated delegate union has incompatible method overloads; validate at the protocol boundary.
function model(tx: Tx, table: string): any { return (tx as any)[DELEGATES[table]]; }
const APPEND = new Set(["sales", "sale_lines", "tenders", "stock_movements", "deni_ledger", "cash_movements"]);
const LOCAL_ONLY = new Set(["stock_qty", "balance", "published_online"]);

/** Prefetch referenced IDs and batch inserts. No network/SQL is done per sale line. */
async function bufferedClient(database: Tx, mutations: any[]) {
  const ids = new Map<string, Set<string>>(SYNC_TABLES.map((table) => [table, new Set<string>()]));
  const references: Record<string, string> = { user_id: "users", product_id: "products", customer_id: "customers", shift_id: "shifts", sale_id: "sales", warehouse_id: "warehouses" };
  for (const mutation of mutations) {
    ids.get(mutation.table)!.add(mutation.row_id);
    for (const [field, table] of Object.entries(references)) if (typeof mutation.payload[field] === "string" && mutation.payload[field]) ids.get(table)!.add(mutation.payload[field]);
  }
  const rows = new Map<string, Map<string, any>>();
  const creates = new Map<string, Map<string, any>>();
  const updates = new Map<string, Map<string, any>>();
  for (const table of SYNC_TABLES) {
    const requested = Array.from(ids.get(table)!);
    const existing = requested.length ? await model(database, table).findMany({ where: { id: { in: requested } } }) : [];
    rows.set(table, new Map(existing.map((row: any) => [row.id, row])));
    creates.set(table, new Map()); updates.set(table, new Map());
  }
  const delegates = new Map(Object.entries(DELEGATES).map(([table, name]) => [name, table]));
  const client = new Proxy(database, {
    get(target, property) {
      const table = delegates.get(String(property));
      if (!table) return Reflect.get(target, property);
      const delegate = model(database, table);
      const current = rows.get(table)!, added = creates.get(table)!, changed = updates.get(table)!;
      const create = async ({ data }: any) => {
        if (current.has(data.id)) throw new SyncError("Duplicate row", 409);
        added.set(data.id, data); current.set(data.id, data); return data;
      };
      const update = async ({ where, data }: any) => {
        if (!current.has(where.id)) throw new SyncError("Row not found", 409);
        const row = { ...current.get(where.id), ...data };
        current.set(where.id, row);
        if (added.has(where.id)) added.set(where.id, row);
        else changed.set(where.id, { ...changed.get(where.id), ...data });
        return row;
      };
      return {
        ...delegate,
        findUnique: (args: any) => args.include ? delegate.findUnique(args) : Promise.resolve(current.get(args.where.id) ?? null),
        create, update,
        upsert: (args: any) => current.has(args.where.id) ? update({ where: args.where, data: args.update }) : create({ data: args.create }),
      };
    },
  });
  return { client, async flush() {
    for (const table of SYNC_TABLES) {
      const delegate = model(database, table), added = Array.from(creates.get(table)!.values());
      if (added.length) await delegate.createMany({ data: added });
      for (const [id, data] of Array.from(updates.get(table)!)) await delegate.update({ where: { id }, data });
    }
  } };
}

export async function deviceIdentity(tx: Tx, token: string): Promise<Identity | null> {
  const device = await tx.device.findUnique({ where: { token }, include: { shop: true } });
  if (!device?.shop.active) return null;
  return { shopId: device.shop_id, businessId: device.shop.business_id };
}

async function assertRowScope(tx: Tx, table: string, row: any, identity: Identity) {
  if (table === "shops") {
    if (row.id !== identity.shopId || row.business_id !== identity.businessId) throw new SyncError("Shop access denied", 403);
  } else if (table === "users") {
    if (row.business_id !== identity.businessId || (row.shop_id !== null && row.shop_id !== identity.shopId)) throw new SyncError("User access denied", 403);
  } else if (table === "sale_lines" || table === "tenders") {
    const parentSale = await tx.sale.findUnique({ where: { id: row.sale_id } });
    if (!parentSale || parentSale.shop_id !== identity.shopId) throw new SyncError("Sale access denied", 403);
  } else if (row.shop_id !== identity.shopId) throw new SyncError("Shop access denied", 403);
}

function scalarData(table: string, payload: Record<string, unknown>) {
  const name = DELEGATES[table];
  const schema = Prisma.dmmf.datamodel.models.find((m) => m.name.toLowerCase() === name.toLowerCase())!;
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (key === "__changed_fields") continue;
    if (LOCAL_ONLY.has(key)) continue;
    const field = schema.fields.find((f) => f.name === key && f.kind === "scalar");
    if (!field) throw new SyncError(`Unsupported field ${table}.${key}`);
    if (key === "warehouse_id" && value === "") { data[key] = null; continue; }
    if (value === null && !field.isRequired) { data[key] = null; continue; }
    if (field.type === "Int" && (!Number.isSafeInteger(value) || Number(value) < -2147483648 || Number(value) > 2147483647)) throw new SyncError("Invalid integer");
    if (field.type === "String" && typeof value !== "string") throw new SyncError("Invalid text");
    if (field.type === "Boolean" && typeof value !== "boolean") throw new SyncError("Invalid flag");
    if (field.type === "DateTime") {
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new SyncError("Invalid date");
      data[key] = new Date(value);
    } else data[key] = value;
  }
  if (schema.fields.some((f) => f.name === "server_updated_at")) data.server_updated_at = new Date();
  if (table === "products") data.updated_at = new Date();
  return data;
}

async function assertReferences(tx: Tx, table: string, row: any, identity: Identity) {
  if (row.user_id) {
    const user = await tx.user.findUnique({ where: { id: row.user_id } });
    if (!user?.active || user.business_id !== identity.businessId || (user.role !== "owner" && user.shop_id !== identity.shopId)) throw new SyncError("User access denied", 403);
    if ((table === "stock_movements" && ["receive", "adjust", "void"].includes(row.type)) || (table === "cash_movements" && ["draw", "expense"].includes(row.type))) {
      if (user.role !== "owner") throw new SyncError("Owner only", 403);
    }
  }
  if (row.product_id) {
    const product = await tx.product.findUnique({ where: { id: row.product_id } });
    if (!product || product.shop_id !== identity.shopId) throw new SyncError("Product access denied", 403);
  }
  if (row.warehouse_id) {
    const warehouse = await tx.warehouse.findUnique({ where: { id: row.warehouse_id } });
    if (!warehouse || warehouse.shop_id !== identity.shopId) throw new SyncError("Warehouse access denied", 403);
  }
  if (row.customer_id) {
    const customer = await tx.customer.findUnique({ where: { id: row.customer_id } });
    if (!customer || customer.shop_id !== identity.shopId) throw new SyncError("Customer access denied", 403);
  }
  if (row.shift_id) {
    const shift = await tx.shift.findUnique({ where: { id: row.shift_id } });
    if (!shift || shift.shop_id !== identity.shopId) throw new SyncError("Shift access denied", 403);
  }
  if (table === "deni_ledger" && row.sale_id) {
    const sale = await tx.sale.findUnique({ where: { id: row.sale_id } });
    if (!sale || sale.shop_id !== identity.shopId || sale.customer_id !== row.customer_id) throw new SyncError("Credit sale access denied", 403);
  }
  if (table === "products" && (row.selling_price < 0 || row.buying_price < 0)) throw new SyncError("Invalid price");
  if (table === "shifts" && (!["open", "closed"].includes(row.status) || row.opening_float < 0 || (row.status === "closed" && (!Number.isSafeInteger(row.counted_cash) || row.counted_cash < 0 || !row.closed_at)))) throw new SyncError("Invalid shift");
  if (table === "sale_lines" && (row.qty <= 0 || row.unit_price < 0 || row.line_total !== row.qty * row.unit_price)) throw new SyncError("Invalid sale line");
  if (table === "tenders" && (!["cash", "mtn_momo", "airtel_money", "credit"].includes(row.method) || row.amount <= 0 || row.change < 0 || (row.method === "cash" && row.amount_tendered - row.amount !== row.change))) throw new SyncError("Invalid tender");
}

export async function applySyncBatch(tx: Tx, identity: Identity, mutations: unknown) {
  if (!Array.isArray(mutations) || mutations.length > 10000) throw new SyncError("Invalid mutations");
  const ids = new Set<string>();
  for (const m of mutations) {
    if (!m || !SYNC_TABLE_SET.has(m.table) || typeof m.id !== "string" || !m.id || ids.has(m.id) || typeof m.row_id !== "string" || !m.row_id || !["insert", "update", "void"].includes(m.op) || !m.payload || typeof m.payload !== "object" || Array.isArray(m.payload)) throw new SyncError("Invalid mutation");
    ids.add(m.id);
  }
  const database = tx;
  const buffered = await bufferedClient(tx, mutations);
  tx = buffered.client;
  // Dependencies first; preserve input order within a table, including multiple edits of one row.
  for (const table of SYNC_TABLES) {
    for (const m of mutations.filter((item) => item.table === table)) {
      const row = { ...m.payload, id: m.row_id };
      await assertRowScope(tx, table, row, identity);
      const delegate = model(tx, table);
      const existing = await delegate.findUnique({ where: { id: m.row_id } });
      if (existing) await assertRowScope(tx, table, existing, identity);
      await assertReferences(tx, table, row, identity);
      const data = scalarData(table, row);
      const patch: Record<string, unknown> = { ...data };
      if (existing && ["products", "customers"].includes(table) && row.__changed_fields !== undefined) {
        const fields: unknown = row.__changed_fields;
        if (!Array.isArray(fields) || fields.some((key) => typeof key !== "string" || !Object.hasOwn(data, key) || ["id", "shop_id", "business_id", "created_at"].includes(key))) throw new SyncError("Invalid catalogue patch");
        for (const key of Object.keys(patch)) if (!["server_updated_at", "updated_at"].includes(key) && !fields.includes(key)) delete patch[key];
      }
      if (table === "shops") {
        if (!existing) throw new SyncError("Create shops through pairing", 403);
        await delegate.update({ where: { id: m.row_id }, data: { name: data.name, momo_number: data.momo_number } });
      } else if (table === "users") {
        if (!["owner", "attendant"].includes(row.role) || (!existing && row.role !== "attendant") || (existing && existing.role !== row.role)) throw new SyncError("Role change denied", 403);
        await delegate.upsert({ where: { id: m.row_id }, create: data, update: { name: data.name, pin_hash: data.pin_hash, active: data.active, server_updated_at: data.server_updated_at } });
      } else if (table === "sales" && m.op === "void") {
        if (!existing || !row.void_reason?.trim()) throw new SyncError("Invalid void");
        const reversal = mutations.find((item) => item.table === "stock_movements" && item.payload.type === "void" && item.payload.ref_id === row.id);
        const owner = reversal && await tx.user.findUnique({ where: { id: reversal.payload.user_id } });
        if (!owner?.active || owner.role !== "owner" || owner.business_id !== identity.businessId) throw new SyncError("Owner only", 403);
        if (existing.status === "voided") {
          const reversals = mutations.filter((item) => item.table === "stock_movements" && item.payload.type === "void" && item.payload.ref_id === row.id);
          for (const item of reversals) {
            if (!await tx.stockMovement.findUnique({ where: { id: item.row_id } })) throw new SyncError("Sale already voided on another device", 409);
          }
        }
        await delegate.update({ where: { id: m.row_id }, data: { status: "voided", void_reason: row.void_reason } });
      } else if (APPEND.has(table)) {
        if (!existing) await delegate.create({ data });
        else {
          // A replay is safe only if it describes the same immutable record.
          for (const key of Object.keys(data)) {
            if (key === "server_updated_at" || (table === "sales" && ["status", "void_reason"].includes(key))) continue;
            const a = data[key] instanceof Date ? (data[key] as Date).toISOString() : data[key];
            const b = existing[key] instanceof Date ? existing[key].toISOString() : existing[key];
            if (a !== b) throw new SyncError("Immutable row conflict", 409);
          }
        }
      } else if (table === "shifts" && existing) {
        if (existing.shop_id !== row.shop_id || existing.user_id !== row.user_id || existing.opening_float !== row.opening_float) throw new SyncError("Shift conflict", 409);
        if (existing.status !== "closed") await delegate.update({ where: { id: row.id }, data });
      } else await delegate.upsert({ where: { id: m.row_id }, create: data, update: patch });
    }
  }
  await buffered.flush();
  tx = database;
  const saleIds = new Set<string>(mutations.filter((m) => m.table === "sales" || m.table === "tenders" || m.table === "sale_lines").map((m) => m.table === "sales" ? m.row_id : m.payload.sale_id));
  const changedSales = saleIds.size ? await tx.sale.findMany({ where: { id: { in: Array.from(saleIds) } }, include: { tenders: true, sale_lines: true } }) : [];
  if (changedSales.length !== saleIds.size) throw new SyncError("Sale not found", 409);
  for (const sale of changedSales) {
    const id = sale.id;
    if (!sale || sale.shop_id !== identity.shopId || !sale.sale_lines.length || sale.tenders.reduce((sum, t) => sum + t.amount, 0) !== sale.total || sale.sale_lines.reduce((sum, l) => sum + l.line_total, 0) !== sale.total || (sale.tenders.some((t) => t.method === "credit") && !sale.customer_id)) throw new SyncError("Sale does not balance", 409);
    if (sale.status === "voided") {
      const movements = await tx.stockMovement.findMany({ where: { shop_id: identity.shopId, type: "void", ref_id: id } });
      const quantities = new Map<string, number>();
      for (const line of sale.sale_lines) quantities.set(line.product_id, (quantities.get(line.product_id) ?? 0) + line.qty);
      for (const movement of movements) quantities.set(movement.product_id, (quantities.get(movement.product_id) ?? 0) - movement.qty_delta);
      if (Array.from(quantities.values()).some((qty) => qty !== 0)) throw new SyncError("Void stock reversal does not balance", 409);
      const credit = sale.tenders.filter((t) => t.method === "credit").reduce((sum, t) => sum + t.amount, 0);
      const ledger = await tx.deniLedger.findMany({ where: { shop_id: identity.shopId, sale_id: id, type: "void" } });
      if (ledger.reduce((sum, row) => sum + row.amount, 0) !== -credit) throw new SyncError("Void credit reversal does not balance", 409);
    }
  }
  // Customer balances are projections of the append-only ledger, never LWW fields.
  const balances = await tx.deniLedger.groupBy({ by: ["customer_id"], where: { shop_id: identity.shopId }, _sum: { amount: true } });
  await tx.customer.updateMany({ where: { shop_id: identity.shopId }, data: { balance: 0 } });
  for (const b of balances) await tx.customer.update({ where: { id: b.customer_id }, data: { balance: b._sum.amount ?? 0 } });
  const touchedShifts = new Set<string>(changedSales.map((sale) => sale.shift_id));
  for (const m of mutations) {
    if (m.table === "shifts") touchedShifts.add(m.row_id);
    if (m.table === "cash_movements") touchedShifts.add(m.payload.shift_id);
  }
  if (touchedShifts.size) {
    const closed = await tx.shift.findMany({ where: { id: { in: Array.from(touchedShifts) }, shop_id: identity.shopId, status: "closed" } });
    if (closed.length) {
      const shiftIds = closed.map((shift) => shift.id);
      const completed = await tx.sale.findMany({ where: { shift_id: { in: shiftIds }, status: "completed" }, include: { tenders: true } });
      const cash = await tx.cashMovement.findMany({ where: { shift_id: { in: shiftIds }, shop_id: identity.shopId } });
      for (const shift of closed) {
        const applied = completed.filter((sale) => sale.shift_id === shift.id).flatMap((sale) => sale.tenders).filter((t) => t.method === "cash").reduce((sum, t) => sum + t.amount, 0);
        const movementTotal = cash.filter((m) => m.shift_id === shift.id).reduce((sum, m) => sum + (m.type === "collection_cash" ? m.amount : ["draw", "expense"].includes(m.type) ? -m.amount : 0), 0);
        const expected = shift.opening_float + applied + movementTotal;
        await tx.shift.update({ where: { id: shift.id }, data: { expected_cash: expected, variance: (shift.counted_cash ?? 0) - expected } });
      }
    }
  }
  return Array.from(ids);
}

export async function readShopSnapshot(tx: Tx, identity: Identity) {
  const { shopId, businessId } = identity;
  const rows: Record<string, any[]> = {};
  rows.shops = await tx.shop.findMany({ where: { id: shopId, business_id: businessId } });
  rows.users = await tx.user.findMany({ where: { business_id: businessId, OR: [{ shop_id: shopId }, { shop_id: null }] } });
  for (const table of SYNC_TABLES.filter((name) => !["shops", "users", "sale_lines", "tenders"].includes(name))) rows[table] = await model(tx, table).findMany({ where: { shop_id: shopId } });
  const saleIds = rows.sales.map((s) => s.id);
  rows.sale_lines = saleIds.length ? await tx.saleLine.findMany({ where: { sale_id: { in: saleIds } } }) : [];
  rows.tenders = saleIds.length ? await tx.tender.findMany({ where: { sale_id: { in: saleIds } } }) : [];
  for (const p of rows.products) delete p.stock_qty;
  return rows;
}

export const SYNC_TRANSACTION_OPTIONS = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 45000 };
export type SyncDatabase = PrismaClient;
