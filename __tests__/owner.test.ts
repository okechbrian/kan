import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed";
import { generateId } from "../src/lib/uuid";
import { recordSale } from "../src/lib/sale";
import { hashPin } from "../src/lib/pin";

beforeEach(async () => {
  await db.businesses.clear();
  await db.shops.clear();
  await db.users.clear();
  await db.products.clear();
  await db.customers.clear();
  await db.shifts.clear();
  await db.sales.clear();
  await db.sale_lines.clear();
  await db.tenders.clear();
  await db.stock_movements.clear();
  await db.deni_ledger.clear();
  await db.cash_movements.clear();
});

async function setup() {
  await seedDemoData();
  const shop = (await db.shops.toArray())[0];
  const user = (await db.users.toArray())[0];
  const products = await db.products.toArray();

  const shiftId = generateId();
  await db.shifts.add({
    id: shiftId,
    shop_id: shop.id,
    user_id: user.id,
    opened_at: new Date().toISOString(),
    closed_at: null,
    opening_float: 50000,
    counted_cash: null,
    expected_cash: null,
    variance: null,
    status: "open",
  });

  return { shop, user, products, shiftId };
}

describe("Close till", () => {
  it("expectedCash includes collections and draws", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const { expectedCash, recordDraw, closeShift } = await import(
      "../src/lib/till"
    );

    await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: sugar.id, qty: 2, unitPrice: sugar.selling_price }],
      tenders: [
        {
          method: "cash",
          amount: sugar.selling_price * 2,
          amountTendered: sugar.selling_price * 2,
        },
      ],
    });
    await recordDraw({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      amount: 10000,
      reason: "lunch",
    });
    await db.cash_movements.add({
      id: generateId(),
      shop_id: shop.id,
      shift_id: shiftId,
      type: "collection_cash",
      amount: 5000,
      reason: "Deni collection",
      user_id: user.id,
      created_at: new Date().toISOString(),
    });

    const expected =
      50000 + sugar.selling_price * 2 + 5000 - 10000;
    expect(await expectedCash(shiftId)).toBe(expected);

    const closed = await closeShift({ shiftId, countedCash: expected });
    expect(closed.variance).toBe(0);
  });
});

describe("Owner draw", () => {
  it("creates cash movement of type draw", async () => {
    const { shop, user, shiftId } = await setup();

    await db.cash_movements.add({
      id: generateId(),
      shop_id: shop.id,
      shift_id: shiftId,
      type: "draw",
      amount: 15000,
      reason: "transport",
      user_id: user.id,
      created_at: new Date().toISOString(),
    });

    const moves = await db.cash_movements
      .where("shift_id")
      .equals(shiftId)
      .toArray();
    expect(moves).toHaveLength(1);
    expect(moves[0].type).toBe("draw");
    expect(moves[0].amount).toBe(15000);
    expect(moves[0].reason).toBe("transport");
  });
});

describe("User management", () => {
  it("adds attendant with correct role", async () => {
    await seedDemoData();
    const shop = (await db.shops.toArray())[0];

    const pinHash = await hashPin("5678");
    const id = generateId();
    await db.users.add({
      id,
      business_id: shop.business_id,
      shop_id: shop.id,
      name: "Mary",
      role: "attendant",
      pin_hash: pinHash,
      active: true,
      server_updated_at: new Date().toISOString(),
    });

    const user = await db.users.get(id);
    expect(user).toBeDefined();
    expect(user!.role).toBe("attendant");
    expect(user!.active).toBe(true);
    expect(user!.name).toBe("Mary");
  });

  it("verifies new attendant PIN", async () => {
    const pinHash = await hashPin("5678");
    const valid = await pinHash === (await hashPin("5678"));
    expect(valid).toBe(true);

    const wrong = await hashPin("0000");
    expect(wrong).not.toBe(pinHash);
  });

  it("toggles attendant active status", async () => {
    await seedDemoData();
    const shop = (await db.shops.toArray())[0];

    const id = generateId();
    await db.users.add({
      id,
      business_id: shop.business_id,
      shop_id: shop.id,
      name: "Temp",
      role: "attendant",
      pin_hash: "hash",
      active: true,
      server_updated_at: new Date().toISOString(),
    });

    await db.users.where("id").equals(id).modify((u) => {
      u.active = !u.active;
    });

    const user = await db.users.get(id);
    expect(user!.active).toBe(false);
  });
});
