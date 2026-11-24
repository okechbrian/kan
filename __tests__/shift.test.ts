import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed";
import { generateId } from "../src/lib/uuid";
import { recordSale } from "../src/lib/sale";
import { recordDraw, expectedCash, closeShift } from "../src/lib/till";

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

describe("Shift", () => {
  it("opens with float and records status", async () => {
    await seedDemoData();
    const shop = (await db.shops.toArray())[0];
    const user = (await db.users.toArray())[0];

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

    const shift = await db.shifts.get(shiftId);
    expect(shift).toBeDefined();
    expect(shift!.opening_float).toBe(50000);
    expect(shift!.status).toBe("open");
  });

  it("closes via closeShift and records variance", async () => {
    await seedDemoData();
    const shop = (await db.shops.toArray())[0];
    const user = (await db.users.toArray())[0];

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

    const result = await closeShift({ shiftId, countedCash: 48000 });
    expect(result.expected).toBe(50000);
    expect(result.variance).toBe(-2000);

    const closed = await db.shifts.get(shiftId);
    expect(closed!.status).toBe("closed");
    expect(closed!.counted_cash).toBe(48000);
    expect(closed!.variance).toBe(-2000);
  });

  it("fixture: float 50,000 + cash 80,000 − draw 10,000 = 120,000", async () => {
    await seedDemoData();
    const shop = (await db.shops.toArray())[0];
    const user = (await db.users.toArray())[0];
    const sugar = (await db.products.toArray()).find(
      (p) => p.name === "Sugar 1kg"
    )!;
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

    await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [
        { productId: sugar.id, qty: 16, unitPrice: sugar.selling_price },
      ],
      tenders: [{ method: "cash", amount: 80000, amountTendered: 80000 }],
    });
    await recordDraw({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      amount: 10000,
      reason: "home",
    });

    expect(await expectedCash(shiftId)).toBe(120000);
    const closed = await closeShift({ shiftId, countedCash: 120000 });
    expect(closed.variance).toBe(0);
  });

  it("cannot close twice", async () => {
    await seedDemoData();
    const shop = (await db.shops.toArray())[0];
    const user = (await db.users.toArray())[0];
    const shiftId = generateId();
    await db.shifts.add({
      id: shiftId,
      shop_id: shop.id,
      user_id: user.id,
      opened_at: new Date().toISOString(),
      closed_at: null,
      opening_float: 0,
      counted_cash: null,
      expected_cash: null,
      variance: null,
      status: "open",
    });
    await closeShift({ shiftId, countedCash: 0 });
    await expect(closeShift({ shiftId, countedCash: 0 })).rejects.toThrow(
      "Till is not open"
    );
  });
});
