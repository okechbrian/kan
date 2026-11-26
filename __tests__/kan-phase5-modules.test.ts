import { beforeEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { POST as storeOrderPost } from "../src/app/api/store/orders/route";
import {
  accountStatement,
  expensesByCategory,
  inventoryValuation,
  REPORT_KEYS,
  toCsv,
} from "../src/lib/analytics/suite";
import { db } from "../src/lib/db";

describe("Kan Phase 5 — 12 analytics reports, store orders, bookings & production", () => {
  beforeEach(async () => {
    await db.bookings.clear();
    await db.production_runs.clear();
    await db.store_orders.clear();
  });

  it("provides all 12 report definitions and integer calculations", () => {
    expect(REPORT_KEYS).toHaveLength(12);

    const val = inventoryValuation([
      { stock_qty: 10, buying_price: 4200, selling_price: 5000 },
      { stock_qty: -2, buying_price: 1000, selling_price: 1500 },
    ]);
    expect(val).toEqual({ totalUnits: 10, costValue: 42000, retailValue: 50000 });

    const cats = expensesByCategory([
      { category: "Rent", amount: 300000 },
      { category: "Transport", amount: 15000 },
      { category: "Rent", amount: 50000 },
    ]);
    expect(cats[0]).toEqual({ category: "Rent", total: 350000, count: 2 });

    const stmt = accountStatement({
      sales: [
        { status: "completed", total: 500000 },
        { status: "voided", total: 20000 },
      ],
      expenses: [{ amount: 50000 }],
      purchases: [{ paid: 200000 }],
    });
    expect(stmt).toEqual({
      grossSales: 500000,
      voidedTotal: 20000,
      totalExpenses: 50000,
      purchasesPaid: 200000,
      netCashFlow: 250000,
    });
  });

  it("formats RFC4180 CSV cleanly", () => {
    const csv = toCsv(
      ["Product", "Price"],
      [
        ['Sugar, "1kg"', 5000],
        ["Soap", 3500],
      ],
    );
    expect(csv).toBe('Product,Price\n"Sugar, ""1kg""",5000\nSoap,3500');
  });

  it("rejects preview checkout honestly without fabricating an order", async () => {
    const response = await storeOrderPost(new Request("http://localhost/api/store/orders", {method:"POST",body:JSON.stringify({slug:"demo-duuka",customerPhone:"0791149592",items:[{name:"Sugar",qty:2,unitPrice:1}],deliveryFee:0})}));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe("ordering_not_available");
    expect(body).not.toHaveProperty("orderId");
    expect(body).not.toHaveProperty("ok", true);
  });

  it("persists Dexie v4 tables (bookings, production_runs, store_orders)", async () => {
    await db.bookings.add({
      id: "bk1",
      shop_id: "s1",
      customer_name: "Miriam",
      customer_phone: "0791149592",
      service_name: "Hair styling",
      staff_name: "Sarah",
      scheduled_at: "2026-11-26T10:00",
      duration_min: 60,
      deposit_ugx: 20000,
      status: "scheduled",
      created_at: "2026-11-25T10:00:00Z",
    });
    await db.production_runs.add({
      id: "pr1",
      shop_id: "s1",
      product_name: "Bread Loaf",
      batch_code: "B-001",
      qty_produced: 40,
      unit: "pc",
      cost_ugx: 120000,
      notes: "25kg flour",
      created_at: "2026-11-25T10:00:00Z",
    });
    await db.store_orders.add({
      id: "so1",
      shop_id: "s1",
      slug: "demo-duuka",
      customer_name: "Kato",
      customer_phone: "0791149592",
      delivery_band: "Pickup",
      items: [{ name: "Sugar 1kg", qty: 2, line_total: 10000 }],
      subtotal: 10000,
      delivery_fee: 0,
      total: 10000,
      status: "pending",
      created_at: "2026-11-25T10:00:00Z",
    });

    expect(await db.bookings.count()).toBe(1);
    expect(await db.production_runs.count()).toBe(1);
    expect(await db.store_orders.count()).toBe(1);
  });

  it("includes every Phase 5 route", () => {
    const root = process.cwd();
    for (const rel of [
      "src/app/app/bookings/page.tsx",
      "src/app/app/production/page.tsx",
      "src/app/app/notifications/page.tsx",
      "src/app/api/store/orders/route.ts",
    ]) {
      expect(existsSync(join(root, rel))).toBe(true);
    }
  });
});
