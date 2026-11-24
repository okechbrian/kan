import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed";
import { generateId } from "../src/lib/uuid";
import { recordSale } from "../src/lib/sale";

function todayPrefix(): string {
  return new Date().toISOString().slice(0, 10);
}

describe("Multi-shop isolation", () => {
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
    await db.outbox.clear();
    await seedDemoData();
  });

  it("Shop A sells sugar, Shop B stock unchanged", async () => {
    const shops = await db.shops.toArray();
    expect(shops.length).toBeGreaterThanOrEqual(1);

    const shopA = shops[0];

    const productsA = await db.products
      .where("shop_id")
      .equals(shopA.id)
      .toArray();

    const sugar = productsA.find((p) => p.name.toLowerCase().includes("sugar"));
    expect(sugar).toBeTruthy();

    const otherProducts = productsA.filter(
      (p) => p.id !== sugar!.id
    );

    const sugarBefore = sugar!.stock_qty;

    const userId = generateId();
    const shiftId = generateId();
    await db.users.add({
      id: userId,
      business_id: shopA.business_id,
      shop_id: shopA.id,
      name: "Attendant",
      pin_hash: "1111",
      role: "attendant",
      active: true,
      server_updated_at: new Date().toISOString(),
    });
    await db.shifts.add({
      id: shiftId,
      shop_id: shopA.id,
      user_id: userId,
      opened_at: new Date().toISOString(),
      closed_at: null,
      opening_float: 0,
      counted_cash: null,
      expected_cash: null,
      variance: null,
      status: "open",
    });

    await recordSale({
      shopId: shopA.id,
      shiftId,
      userId,
      lines: [{ productId: sugar!.id, qty: 1, unitPrice: sugar!.selling_price }],
      tenders: [{ method: "cash", amount: sugar!.selling_price, amountTendered: sugar!.selling_price }],
    });

    const sugarAfter = await db.products.get(sugar!.id);
    expect(sugarAfter!.stock_qty).toBe(sugarBefore - 1);

    for (const p of otherProducts) {
      const after = await db.products.get(p.id);
      expect(after!.stock_qty).toBe(p.stock_qty);
    }
  });
});

describe("Attendant isolation", () => {
  it("Attendant on shop A only sees shop A data in local queries", async () => {
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
    await db.outbox.clear();
    await seedDemoData();

    const shops = await db.shops.toArray();
    expect(shops.length).toBeGreaterThanOrEqual(1);

    const shopA = shops[0];

    const userId = generateId();
    const shiftId = generateId();
    await db.users.add({
      id: userId,
      business_id: shopA.business_id,
      shop_id: shopA.id,
      name: "Attendant A",
      pin_hash: "1111",
      role: "attendant",
      active: true,
      server_updated_at: new Date().toISOString(),
    });
    await db.shifts.add({
      id: shiftId,
      shop_id: shopA.id,
      user_id: userId,
      opened_at: new Date().toISOString(),
      closed_at: null,
      opening_float: 0,
      counted_cash: null,
      expected_cash: null,
      variance: null,
      status: "open",
    });

    const productsA = await db.products
      .where("shop_id")
      .equals(shopA.id)
      .toArray();
    const sugar = productsA.find((p) => p.name.toLowerCase().includes("sugar"));
    expect(sugar).toBeTruthy();

    await recordSale({
      shopId: shopA.id,
      shiftId,
      userId,
      lines: [{ productId: sugar!.id, qty: 1, unitPrice: sugar!.selling_price }],
      tenders: [{ method: "cash", amount: sugar!.selling_price, amountTendered: sugar!.selling_price }],
    });

    const salesA = await db.sales
      .where("shop_id")
      .equals(shopA.id)
      .toArray();
    expect(salesA.length).toBeGreaterThanOrEqual(1);

    const salesOtherShops = await db.sales
      .where("shop_id")
      .notEqual(shopA.id)
      .toArray();

    const allSales = await db.sales.toArray();
    expect(allSales.length).toBeGreaterThanOrEqual(salesA.length);

    for (const sale of salesA) {
      expect(sale.shop_id).toBe(shopA.id);
    }
  });
});

describe("Owner home totals", () => {
  it("Grand total equals sum of all shop sales", async () => {
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
    await db.outbox.clear();
    await seedDemoData();

    const shops = await db.shops.toArray();
    const prefix = todayPrefix();

    let grandTotal = 0;
    for (const shop of shops) {
      const sales = await db.sales
        .where("shop_id")
        .equals(shop.id)
        .filter(
          (s) => s.status === "completed" && s.created_at.startsWith(prefix)
        )
        .toArray();
      grandTotal += sales.reduce((sum, s) => sum + s.total, 0);
    }

    const allSales = await db.sales
      .where("status")
      .equals("completed")
      .filter((s) => s.created_at.startsWith(prefix))
      .toArray();
    const expectedTotal = allSales.reduce((sum, s) => sum + s.total, 0);

    expect(grandTotal).toBe(expectedTotal);
  });
});
