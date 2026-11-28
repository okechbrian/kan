import Dexie from "dexie";
import { db, type Business, type Device } from "./db";
import { SYNC_TABLES, REMOTE_TRANSACTION } from "./sync-tables";
import { bindDeviceShop, recomputeStockQty, setDeviceToken, setSyncCursor } from "./sync";
import { clearSession } from "./session";

type Row = Record<string, any>;
export type CloudPairing = { protocol: number; business: Business; shop_id: string; owner_id: string; device: Device; rows: Record<string, Row[]>; new_cursor: string };

export async function assertPairingDestination(shopId: string, businessId?: string) {
  const shops = await db.shops.toArray();
  if (shops.some((shop) => shop.id !== shopId || (businessId && shop.business_id !== businessId)) ||
      (businessId && (await db.businesses.toArray()).some((business) => business.id !== businessId))) {
    throw new Error("This browser already holds another till. Keep its books and use an empty browser profile for this branch.");
  }
  if (await db.outbox.filter((entry) => entry.synced_at === null).count()) throw new Error("This till has unsent work. Sync and back up its books before connecting again.");
}

export async function activateCloudBranch(shopId: string) {
  const device = await db.devices.where("shop_id").equals(shopId).first();
  if (!device) return false;
  // Device credentials are committed with the books first, so interrupted activation can resume.
  clearSession();
  bindDeviceShop(shopId);
  localStorage.setItem("duuka_shop_id", shopId);
  setDeviceToken(device.token);
  return true;
}

export async function installCloudBranch(data: CloudPairing, expectedShop: string, expectedDevice: string) {
  if (data?.protocol !== 2 || data.shop_id !== expectedShop || !data.business?.id ||
      data.device?.id !== expectedDevice || data.device.shop_id !== expectedShop ||
      !/^[a-f0-9]{64}$/i.test(data.device.token) || typeof data.new_cursor !== "string") throw new Error("Invalid branch response");
  for (const table of SYNC_TABLES) if (!Array.isArray(data.rows?.[table])) throw new Error("Incomplete branch snapshot");
  if (data.rows.shops.length !== 1 || data.rows.shops[0].id !== expectedShop || data.rows.shops[0].business_id !== data.business.id || data.rows.shops[0].currency !== "UGX") throw new Error("Wrong branch snapshot");
  const keys = new Map(SYNC_TABLES.map((name) => [name, new Set(data.rows[name].map((row) => row.id))]));
  const refs: Record<string, typeof SYNC_TABLES[number]> = { user_id: "users", product_id: "products", customer_id: "customers", sale_id: "sales", shift_id: "shifts", warehouse_id: "warehouses" };
  const money = new Set(["amount", "amount_tendered", "change", "balance", "total", "unit_price", "line_total", "opening_float", "expected_cash", "counted_cash", "variance", "selling_price", "buying_price", "buying_price_snapshot"]);
  for (const table of SYNC_TABLES) for (const row of data.rows[table]) {
    if (typeof row.id !== "string") throw new Error("Invalid branch row");
    if (table === "users" ? row.business_id !== data.business.id || (row.shop_id !== null && row.shop_id !== expectedShop) :
        table !== "shops" && !["sale_lines", "tenders"].includes(table) && row.shop_id !== expectedShop) throw new Error("Foreign branch row");
    for (const [key, value] of Object.entries(row)) {
      if (money.has(key) && value !== null && !Number.isSafeInteger(value)) throw new Error("Invalid integer amount");
      if (refs[key] && value && !keys.get(refs[key])!.has(value)) throw new Error("Foreign branch reference");
    }
  }
  if (!data.rows.users.some((user) => user.id === data.owner_id && user.role === "owner" && user.active)) throw new Error("Missing branch owner");
  await db.transaction("rw", [...SYNC_TABLES.map((name) => db.table(name)), db.businesses, db.devices, db.outbox], async () => {
    await assertPairingDestination(expectedShop, data.business.id);
    (Dexie.currentTransaction as unknown as Record<string, unknown>)[REMOTE_TRANSACTION] = true;
    await db.businesses.put(data.business);
    for (const name of SYNC_TABLES) await db.table(name).bulkPut(data.rows[name]);
    for (const product of data.rows.products) await db.products.update(product.id, { stock_qty: await recomputeStockQty(product.id) });
    for (const customer of data.rows.customers) {
      const ledger = await db.deni_ledger.where("customer_id").equals(customer.id).toArray();
      await db.customers.update(customer.id, { balance: ledger.reduce((sum, row) => sum + row.amount, 0) });
    }
    await db.devices.put(data.device);
  });
  setSyncCursor(data.new_cursor);
  await activateCloudBranch(expectedShop);
}
