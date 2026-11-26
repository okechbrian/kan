import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed";
import { recordSale, recordDeniCollection, voidSale } from "../src/lib/sale";
import { recordExpense, recordDraw, expectedCash, closeShift } from "../src/lib/till";
import { receiveStock, adjustStock } from "../src/lib/stock";
import { ownerContext, ownerRows } from "../src/lib/dashboard/access";
import { exportBackup, importBackup } from "../src/lib/backup";
import { BACKUP_TABLES } from "../src/lib/backup-tables";

beforeEach(async () => { for (const table of db.tables) await table.clear(); await seedDemoData(); });
afterEach(() => vi.unstubAllGlobals());

async function fixture() {
  const shop = (await db.shops.toArray())[0], owner = (await db.users.toArray())[0], product = (await db.products.toArray())[0];
  await db.shifts.add({ id: "shift", shop_id: shop.id, user_id: owner.id, opened_at: new Date().toISOString(), closed_at: null, opening_float: 50000, counted_cash: null, expected_cash: null, variance: null, status: "open" });
  await db.customers.add({ id: "customer", shop_id: shop.id, name: "Customer", phone: "", notes: "", balance: 0, server_updated_at: new Date().toISOString() });
  return { shop, owner, product };
}
async function sell(method: "cash" | "credit" = "cash") {
  const f = await fixture();
  const sale = await recordSale({ shopId: f.shop.id, shiftId: "shift", userId: f.owner.id, customerId: method === "credit" ? "customer" : undefined, lines: [{ productId: f.product.id, qty: 1, unitPrice: 5000 }], tenders: method === "credit" ? [{ method, amount: 2000 }, { method, amount: 3000 }] : [{ method, amount: 5000 }] });
  return { ...f, ...sale };
}
function session(userId: string, shopId: string) {
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  const values = new Map([["duuka_user_id", userId], ["duuka_shop_id", shopId]]);
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
}

describe("audit regression — ledger integrity", () => {
  it("rejects missing/closed shifts and foreign products without writing a sale", async () => {
    const { shop, owner, product } = await fixture();
    const opts = { shopId: shop.id, shiftId: "missing", userId: owner.id, lines: [{ productId: product.id, qty: 1, unitPrice: 5000 }], tenders: [{ method: "cash" as const, amount: 5000 }] };
    await expect(recordSale(opts)).rejects.toThrow("Till is not open");
    await db.shifts.update("shift", { status: "closed" });
    await expect(recordSale({ ...opts, shiftId: "shift" })).rejects.toThrow("Till is not open");
    await db.shifts.update("shift", { status: "open" });
    await db.products.update(product.id, { shop_id: "foreign-shop" });
    await expect(recordSale({ ...opts, shiftId: "shift" })).rejects.toThrow("Product not found");
    expect(await db.sales.count()).toBe(0);
  });
  it("rejects foreign customers and inactive actors", async () => {
    const { shop, owner, product } = await fixture();
    await db.customers.update("customer", { shop_id: "foreign-shop" });
    const opts = { shopId: shop.id, shiftId: "shift", userId: owner.id, customerId: "customer", lines: [{ productId: product.id, qty: 1, unitPrice: 5000 }], tenders: [{ method: "credit" as const, amount: 5000 }] };
    await expect(recordSale(opts)).rejects.toThrow("Customer not found");
    await db.users.update(owner.id, { active: false });
    await expect(recordSale(opts)).rejects.toThrow("Shop access denied");
  });
  it("reverses ALL credit tenders and queues the void with its reversals", async () => {
    const { saleId, owner, product } = await sell("credit");
    await voidSale({ saleId, userId: owner.id, reason: "Wrong item" });
    expect((await db.customers.get("customer"))?.balance).toBe(0);
    expect((await db.products.get(product.id))?.stock_qty).toBe(product.stock_qty);
    const queued = await db.outbox.toArray();
    expect(queued.some((row) => row.table === "sales" && row.op === "void")).toBe(true);
    expect(queued.some((row) => row.table === "deni_ledger" && JSON.parse(row.payload).type === "void")).toBe(true);
  });
  it("concurrent void requests reverse stock only once", async () => {
    const { saleId, owner, product } = await sell();
    const results = await Promise.allSettled([voidSale({saleId,userId:owner.id,reason:"Return"}),voidSale({saleId,userId:owner.id,reason:"Return"})]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await db.products.get(product.id))?.stock_qty).toBe(product.stock_qty);
  });
  it("recomputes a closed shift's expected cash and variance when its sale is voided", async () => {
    const {saleId,owner}=await sell();
    await closeShift({shiftId:"shift",userId:owner.id,countedCash:55000});
    await voidSale({saleId,userId:owner.id,reason:"Return after close"});
    expect((await db.shifts.get("shift"))?.expected_cash).toBe(50000);
    expect((await db.shifts.get("shift"))?.variance).toBe(5000);
  });
  it("concurrent collections cannot overcollect", async () => {
    const { shop, owner } = await sell("credit");
    const collect = () => recordDeniCollection({shopId:shop.id,shiftId:"shift",userId:owner.id,customerId:"customer",amount:4000,method:"cash"});
    const results = await Promise.allSettled([collect(),collect()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await db.customers.get("customer"))?.balance).toBe(1000);
    expect(await expectedCash("shift")).toBe(54000);
  });
  it("cash expenses lower expected cash; MoMo expenses do not", async () => {
    const { shop, owner } = await fixture();
    await recordExpense({shopId:shop.id,userId:owner.id,category:"Transport",amount:5000,description:"Boda",method:"cash"});
    await recordExpense({shopId:shop.id,userId:owner.id,category:"Utilities",amount:7000,description:"Power",method:"mtn_momo"});
    expect(await expectedCash("shift")).toBe(45000);
    expect(await db.expenses.count()).toBe(2);
    const close = await closeShift({shiftId:"shift",countedCash:45000,userId:owner.id});
    expect(close.variance).toBe(0);
    await expect(recordExpense({shopId:shop.id,userId:owner.id,category:"Fuel",amount:1000,description:"",method:"cash"})).rejects.toThrow("Open the till");
  });
  it("captures receives, adjustments, draws and shift closes durably", async () => {
    const {shop,owner,product} = await fixture();
    await db.outbox.clear();
    await receiveStock({shopId:shop.id,userId:owner.id,lines:[{productId:product.id,qty:10,unitCost:2000}]});
    await adjustStock({shopId:shop.id,userId:owner.id,productId:product.id,countedQty:20,reason:"Count"});
    await recordDraw({shopId:shop.id,shiftId:"shift",userId:owner.id,amount:1000,reason:"Home"});
    await closeShift({shiftId:"shift",userId:owner.id,countedCash:49000});
    const tables = (await db.outbox.toArray()).map((row) => row.table);
    expect(tables).toContain("stock_movements"); expect(tables).toContain("cash_movements"); expect(tables).toContain("shifts");
  });
  it("does not upload stale product/customer snapshots for projection-only changes", async () => {
    const {shop,owner,product} = await fixture();
    await db.outbox.clear();
    await recordSale({shopId:shop.id,shiftId:"shift",userId:owner.id,customerId:"customer",lines:[{productId:product.id,qty:1,unitPrice:5000}],tenders:[{method:"credit",amount:5000}]});
    const rows=await db.outbox.toArray();
    expect(rows.filter((row) => ["products","customers"].includes(row.table))).toHaveLength(0);
    expect(rows.some((row) => row.table === "deni_ledger")).toBe(true);
  });
  it("rolls back outbox entries together with a failed business transaction", async () => {
    const { product } = await fixture();
    await db.outbox.clear();
    await expect(db.transaction("rw", db.products, async () => { await db.products.update(product.id,{name:"Should roll back"}); throw new Error("Simulated failure"); })).rejects.toThrow("Simulated failure");
    expect((await db.products.get(product.id))?.name).toBe(product.name);
    expect(await db.outbox.count()).toBe(0);
  });
});

describe("audit regression — dashboard and backups", () => {
  it("denies attendants and limits owner queries to the selected shop", async () => {
    const {shop,owner,product} = await fixture();
    await db.products.add({...product,id:"foreign-product",shop_id:"foreign-shop",name:"Secret"});
    session(owner.id,shop.id);
    expect((await ownerRows(db.products)).some((p) => p.id === "foreign-product")).toBe(false);
    await db.users.add({...owner,id:"attendant",role:"attendant",shop_id:shop.id});
    session("attendant",shop.id);
    await expect(ownerContext()).rejects.toThrow("owner PIN");
    await expect(ownerRows(db.products)).rejects.toThrow("owner PIN");
  });
  it("exports every business table and restores newer books on a fresh database", async () => {
    const { shop, owner, product } = await fixture();
    await recordExpense({shopId:shop.id,userId:owner.id,category:"Transport",amount:1000,description:"Boda",method:"cash"});
    const sale = await recordSale({shopId:shop.id,shiftId:"shift",userId:owner.id,lines:[{productId:product.id,qty:1,unitPrice:5000}],tenders:[{method:"cash",amount:5000}]});
    await db.bookings.add({id:"booking",shop_id:shop.id,customer_name:"Mary",customer_phone:"",service_name:"Hair",staff_name:"",scheduled_at:new Date().toISOString(),duration_min:30,deposit_ugx:0,status:"scheduled",created_at:new Date().toISOString()});
    const backup = await exportBackup();
    expect(Array.from(BACKUP_TABLES).sort()).toEqual(db.tables.map((table) => table.name).filter((name) => !["devices", "outbox"].includes(name)).sort());
    for (const name of BACKUP_TABLES) expect(backup).toHaveProperty(name);
    expect(backup).not.toHaveProperty("devices");
    for (const table of db.tables) await table.clear();
    await importBackup(backup);
    expect(await db.expenses.count()).toBe(1); expect(await db.bookings.count()).toBe(1);
    expect(await db.cash_movements.count()).toBe(1);
    const restored = await db.outbox.toArray();
    const cohort = restored.filter((entry) => entry.row_id === sale.saleId || JSON.parse(entry.payload).sale_id === sale.saleId || JSON.parse(entry.payload).ref_id === sale.saleId);
    expect(cohort.length).toBeGreaterThanOrEqual(4);
    expect(new Set(cohort.map((entry) => entry.batch_id)).size).toBe(1);
  });
  it("validates backups before clearing existing books", async () => {
    const before = await db.products.count();
    await expect(importBackup({version:999})).rejects.toThrow("Unsupported");
    expect(await db.products.count()).toBe(before);
    const backup = await exportBackup();
    backup.purchases = [{id:"bad-purchase",shop_id:backup.shops[0].id,items:[{name:"Sugar",unit_cost:0.5,qty:1}]}];
    await expect(importBackup(backup)).rejects.toThrow("Invalid integer");
    expect(await db.products.count()).toBe(before);
  });
});
