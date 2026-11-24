import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed";
import { hashPin, verifyPin, shopIdForUser } from "../src/lib/pin";

beforeEach(async () => {
  await db.businesses.clear();
  await db.shops.clear();
  await db.users.clear();
  await db.products.clear();
  await db.stock_movements.clear();
});

describe("PIN", () => {
  it("verifies the demo owner PIN 1234", async () => {
    await seedDemoData();
    const owner = (await db.users.toArray())[0];
    expect(await verifyPin("1234", owner.pin_hash)).toBe(true);
    expect(await verifyPin("0000", owner.pin_hash)).toBe(false);
  });

  it("still accepts a legacy unsalted hash", async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode("1234");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const legacy = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(await verifyPin("1234", legacy)).toBe(true);
  });

  it("binds a business-level owner to the demo shop", async () => {
    await seedDemoData();
    const owner = (await db.users.toArray())[0];
    expect(owner.shop_id).toBeNull();
    const shopId = await shopIdForUser(owner);
    const shop = (await db.shops.toArray())[0];
    expect(shopId).toBe(shop.id);
  });

  it("new hashes are not raw SHA-256 of the PIN", async () => {
    const hashed = await hashPin("1234");
    const encoder = new TextEncoder();
    const data = encoder.encode("1234");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const raw = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(hashed).not.toBe(raw);
  });
});
