import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../src/lib/db";
import { SYNC_TABLES } from "../src/lib/sync-tables";
import { installCloudBranch, activateCloudBranch, type CloudPairing } from "../src/lib/cloud-pairing";
import { hashPin, shopIdForUser } from "../src/lib/pin";
import { getDeviceToken } from "../src/lib/sync";
import { POST as legacyCreate } from "../src/app/api/pair/create/route";
import { POST as pairRoute } from "../src/app/api/platform/pair/route";

const now = new Date().toISOString();
async function snapshot(): Promise<CloudPairing> {
  const rows = Object.fromEntries(SYNC_TABLES.map((name) => [name, []])) as CloudPairing["rows"];
  rows.shops = [{ id: "shop", business_id: "business", name: "Cloud Main", shop_code: "KAN-1234", currency: "UGX", active: true, momo_number: "", server_updated_at: now }];
  rows.users = [{ id: "owner", business_id: "business", shop_id: null, role: "owner", name: "Owner", pin_hash: await hashPin("5678"), active: true, server_updated_at: now }];
  rows.products = [{ id: "sugar", shop_id: "shop", name: "Sugar", unit: "pc", selling_price: 5000, buying_price: 4000, active: true, server_updated_at: now }];
  rows.stock_movements = [{ id: "opening", shop_id: "shop", product_id: "sugar", user_id: "owner", qty_delta: 20, type: "receive", created_at: now, reason: "Opening", ref_id: "" }];
  return { protocol: 2, shop_id: "shop", owner_id: "owner", business: { id: "business", name: "Cloud Business", created_at: now, server_updated_at: now }, device: { id: "device", shop_id: "shop", name: "Till", token: "a".repeat(64) }, rows, new_cursor: now };
}
beforeEach(async () => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key), clear: () => storage.clear() });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  for (const table of db.tables) await table.clear();
});
afterEach(() => vi.unstubAllGlobals());
describe("atomic cloud branch installation", () => {
  it("preserves cloud IDs, derives stock and creates no outbox echoes", async () => {
    const data = await snapshot();
    await installCloudBranch(data, "shop", "device");
    expect((await db.businesses.toArray()).map((row) => row.id)).toEqual(["business"]);
    expect((await db.shops.toArray()).map((row) => row.id)).toEqual(["shop"]);
    expect((await db.products.get("sugar"))?.stock_qty).toBe(20);
    expect(await db.outbox.count()).toBe(0);
    expect(getDeviceToken()).toBe(data.device.token);
    expect(localStorage.getItem("duuka_user_id")).toBeNull();
    expect(await shopIdForUser((await db.users.get("owner"))!)).toBe("shop");
    await installCloudBranch(data, "shop", "device");
    expect(await db.devices.count()).toBe(1); expect(await db.shops.count()).toBe(1);
  });
  it("rejects foreign rows and unsafe money before installing anything", async () => {
    const foreign = await snapshot(); foreign.rows.products[0].shop_id = "another-shop";
    await expect(installCloudBranch(foreign, "shop", "device")).rejects.toThrow("Foreign");
    expect(await db.shops.count()).toBe(0);
    const bad = await snapshot(); bad.rows.products[0].selling_price = 0.5;
    await expect(installCloudBranch(bad, "shop", "device")).rejects.toThrow("integer");
    expect(await db.devices.count()).toBe(0);
  });
  it("keeps another till and unsent work unchanged", async () => {
    const data = await snapshot(); await installCloudBranch(data, "shop", "device");
    await db.products.update("sugar", { name: "Unsent edit" });
    const pending = await db.outbox.toArray();
    await expect(installCloudBranch(data, "shop", "device")).rejects.toThrow("unsent");
    expect(await db.outbox.toArray()).toEqual(pending);
    expect((await db.products.get("sugar"))?.name).toBe("Unsent edit");
    const other = await snapshot(); other.shop_id = "other"; other.rows.shops[0].id = "other"; other.device.shop_id = "other";
    await expect(installCloudBranch(other, "other", "device")).rejects.toThrow();
    expect((await db.shops.toArray()).map((row) => row.id)).toEqual(["shop"]);
  });
  it("rolls back the entire import on an IndexedDB error", async () => {
    const data = await snapshot();
    const write = vi.spyOn(db.devices, "put").mockRejectedValueOnce(new Error("disk_full"));
    await expect(installCloudBranch(data, "shop", "device")).rejects.toThrow("disk_full");
    write.mockRestore();
    expect(await db.businesses.count()).toBe(0); expect(await db.products.count()).toBe(0);
    expect(getDeviceToken()).toBeNull();
  });
  it("resumes credential activation from committed books and respects the bound branch", async () => {
    const data = await snapshot(); await installCloudBranch(data, "shop", "device");
    localStorage.clear();
    expect(await activateCloudBranch("shop")).toBe(true);
    expect(getDeviceToken()).toBe(data.device.token);
    expect(await shopIdForUser({ role: "owner", business_id: "foreign-business", shop_id: null })).toBeNull();
  });
  it("retains committed books if credential activation is interrupted", async () => {
    const data = await snapshot();
    const write = vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => { throw new Error("storage_full"); });
    await expect(installCloudBranch(data, "shop", "device")).rejects.toThrow("storage_full");
    write.mockRestore();
    expect(await db.devices.count()).toBe(1); expect(await db.shops.count()).toBe(1);
    expect(await activateCloudBranch("shop")).toBe(true);
    expect(getDeviceToken()).toBe(data.device.token);
    expect(await db.outbox.count()).toBe(0);
  });
  it("refuses cross-origin pairing and legacy duplicate workspace creation", async () => {
    expect((await pairRoute(new Request("https://kan.test/api/platform/pair", { method: "POST", headers: { origin: "https://other.invalid" } }))).status).toBe(403);
    expect((await legacyCreate(new Request("https://kan.test/api/pair/create", { method: "POST", headers: { cookie: "kan_session=existing-session" }, body: "{}" }))).status).toBe(409);
  });
});
