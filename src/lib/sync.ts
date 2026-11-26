import Dexie from "dexie";
import { db } from "./db";
import { generateId } from "./uuid";
import { SYNC_TABLES, SYNC_TABLE_SET, REMOTE_TRANSACTION } from "./sync-tables";

const DEVICE_TOKEN_KEY = "duuka_device_token";
const SYNC_CURSOR_KEY = "duuka_sync_cursor";
export function getDeviceToken(): string | null { return typeof window === "undefined" ? null : localStorage.getItem(DEVICE_TOKEN_KEY); }
export function setDeviceToken(token: string): void { localStorage.setItem(DEVICE_TOKEN_KEY, token); }
export function clearDeviceToken(): void { localStorage.removeItem(DEVICE_TOKEN_KEY); localStorage.removeItem(SYNC_CURSOR_KEY); }
export function getSyncCursor(): string { return typeof window === "undefined" ? "0" : localStorage.getItem(SYNC_CURSOR_KEY) || "0"; }
export function setSyncCursor(cursor: string): void { localStorage.setItem(SYNC_CURSOR_KEY, cursor); }
export function isOnline(): boolean { return typeof navigator === "undefined" || navigator.onLine; }

export async function addToOutbox(table: string, rowId: string, op: "insert" | "update" | "void", payload: unknown): Promise<void> {
  await db.transaction("rw", db.outbox, async () => {
    await db.outbox.add({ id: generateId(), table, row_id: rowId, op, payload: JSON.stringify(payload), created_at: new Date().toISOString(), synced_at: null, sequence: await db.outbox.count() + 1 });
  });
}
/** Compatibility helper. Ledger code relies on automatic transactional capture. */
export async function queueAndMaybeSync(items: { table: string; row_id: string; op: "insert" | "update" | "void"; payload: unknown }[]): Promise<void> {
  await db.transaction("rw", db.outbox, async () => {
    for (const item of items) await addToOutbox(item.table, item.row_id, item.op, item.payload);
  });
  if (getDeviceToken() && isOnline()) void syncNow();
}

async function boundShopId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("duuka_paired_shop_id") || localStorage.getItem("duuka_shop_id");
}
export function bindDeviceShop(shopId: string) { localStorage.setItem("duuka_paired_shop_id", shopId); }
async function belongsToShop(item: {table: string; payload: string}, shopId: string) {
  const row = JSON.parse(item.payload);
  if (item.table === "shops") return row.id === shopId;
  if (item.table === "users") {
    const shop = await db.shops.get(shopId);
    return row.business_id === shop?.business_id && (row.shop_id === null || row.shop_id === shopId);
  }
  if (item.table === "sale_lines" || item.table === "tenders") return (await db.sales.get(row.sale_id))?.shop_id === shopId;
  return row.shop_id === shopId;
}

export async function pushOutbox(): Promise<{ pushed: number; failed: number }> {
  const token = getDeviceToken();
  if (!token) return { pushed: 0, failed: 0 };
  const all = await db.outbox.filter((item) => item.synced_at === null).sortBy("created_at");
  const shopId = await boundShopId();
  const eligible = [];
  for (const item of all) if (SYNC_TABLE_SET.has(item.table) && (!shopId || await belongsToShop(item, shopId))) eligible.push(item);
  eligible.sort((a, b) => a.sequence !== undefined && b.sequence !== undefined ? a.sequence - b.sequence : a.sequence === undefined && b.sequence !== undefined ? -1 : b.sequence === undefined && a.sequence !== undefined ? 1 : a.created_at.localeCompare(b.created_at));
  const groups = new Map<string, typeof eligible>();
  for (const item of eligible) {
    const key = item.batch_id ?? item.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  const pending: typeof eligible = [];
  for (const group of Array.from(groups.values())) {
    if (pending.length && pending.length + group.length > 1000) break;
    pending.push(...group);
  }
  if (!pending.length) return { pushed: 0, failed: 0 };
  try {
    const res = await fetch("/api/sync", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mutations: pending.map((item) => ({ id: item.id, table: item.table, row_id: item.row_id, op: item.op, payload: JSON.parse(item.payload) })) }),
    });
    if (!res.ok) return { pushed: 0, failed: pending.length };
    const body = await res.json();
    if (body.protocol !== 2 || !Array.isArray(body.acknowledged)) return { pushed: 0, failed: pending.length };
    const accepted = new Set(body.acknowledged.filter((id: unknown) => typeof id === "string"));
    const acknowledged = pending.filter((item) => accepted.has(item.id));
    await db.transaction("rw", db.outbox, async () => {
      const syncedAt = new Date().toISOString();
      await db.outbox.bulkPut(acknowledged.map((item) => ({ ...item, synced_at: syncedAt })));
    });
    return { pushed: acknowledged.length, failed: pending.length - acknowledged.length };
  } catch { return { pushed: 0, failed: pending.length }; }
}

export async function pullSync(): Promise<{ pulled: number; cursor: string } | null> {
  const token = getDeviceToken();
  if (!token) return null;
  try {
    const response = await fetch(`/api/sync?since=${encodeURIComponent(getSyncCursor())}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) return null;
    const { rows, new_cursor, shop_id: shopId, protocol } = await response.json();
    if (protocol !== 2 || !rows || typeof new_cursor !== "string" || typeof shopId !== "string") return null;
    const expectedShop = await boundShopId();
    if (expectedShop && expectedShop !== shopId) throw new Error("Wrong shop snapshot");
    let pulled = 0;
    await db.transaction("rw", [...SYNC_TABLES.map((name) => db.table(name)), db.outbox], async () => {
      (Dexie.currentTransaction as unknown as Record<string, unknown>)[REMOTE_TRANSACTION] = true;
      const pending = await db.outbox.filter((item) => item.synced_at === null).toArray();
      const localKeys = new Set(pending.map((item) => `${item.table}:${item.row_id}`));
      for (const [name, values] of Object.entries(rows)) {
        if (!SYNC_TABLE_SET.has(name) || !Array.isArray(values)) throw new Error("Invalid sync table");
        for (const row of values) {
          if (!row || typeof row.id !== "string") throw new Error("Invalid row");
          if (name === "shops" ? row.id !== shopId : !["users", "sale_lines", "tenders"].includes(name) && row.shop_id !== shopId) throw new Error("Wrong shop row");
          if (localKeys.has(`${name}:${row.id}`)) continue;
          const existing = await db.table(name).get(row.id);
          const incoming = { ...row };
          if (name === "products") delete incoming.stock_qty;
          if (name === "batches" && typeof incoming.expiry_date === "string") incoming.expiry_date = incoming.expiry_date.slice(0, 10);
          await db.table(name).put({ ...existing, ...incoming });
          pulled++;
        }
      }
      for (const product of await db.products.where("shop_id").equals(shopId).toArray()) await db.products.update(product.id, { stock_qty: await recomputeStockQty(product.id) });
      for (const customer of await db.customers.where("shop_id").equals(shopId).toArray()) {
        const ledger = await db.deni_ledger.where("customer_id").equals(customer.id).toArray();
        await db.customers.update(customer.id, { balance: ledger.reduce((sum, entry) => sum + entry.amount, 0) });
      }
    });
    // Advance only after every row and projection committed successfully.
    setSyncCursor(new_cursor);
    bindDeviceShop(shopId);
    return { pulled, cursor: new_cursor };
  } catch { return null; }
}
let running: Promise<{ pushed: number; pulled: number; failed: number }> | null = null;
export function syncNow(): Promise<{ pushed: number; pulled: number; failed: number }> {
  if (running) return running;
  running = (async () => {
    if (!isOnline()) return { pushed: 0, pulled: 0, failed: 0 };
    const result = await pushOutbox();
    const pull = result.failed ? null : await pullSync();
    return { ...result, pulled: pull?.pulled ?? 0, failed: result.failed || (getDeviceToken() && !pull ? 1 : 0) };
  })().finally(() => { running = null; });
  return running;
}
export async function recomputeStockQty(productId: string): Promise<number> {
  return (await db.stock_movements.where("product_id").equals(productId).toArray()).reduce((sum, movement) => sum + movement.qty_delta, 0);
}
