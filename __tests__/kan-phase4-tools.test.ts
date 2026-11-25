import { beforeEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { db } from "../src/lib/db";
import {
  buildBranchCopyPlan,
  parseProductsCsv,
  summarizeDashboard,
  validateExpenseInput,
  validatePurchaseInput,
  validateReservedOrderInput,
} from "../src/lib/dashboard/tools";

describe("Kan Phase 4 — dashboard tools, CSV, branch copy & Dexie v3", () => {
  beforeEach(async () => {
    await db.expenses.clear();
    await db.suppliers.clear();
    await db.purchases.clear();
    await db.reserved_orders.clear();
  });

  it("parses CSV products with integer UGX validation and skips header", () => {
    const csv = `name,unit,buying_price,selling_price,stock_qty,barcode,brand
Sugar 1kg,kg,4200,5000,20,600111,Kakira
Bad Price,pc,100,0,5,,
Bad Float,pc,100.5,200,1,,
Soap,pc,2500,3500,12,,Mukwano`;

    const result = parseProductsCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.errors).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      name: "Sugar 1kg",
      buying_price: 4200,
      selling_price: 5000,
      stock_qty: 20,
      barcode: "600111",
      brand: "Kakira",
    });
  });

  it("builds a branch copy plan with zero opening qty and skips duplicates", () => {
    const plan = buildBranchCopyPlan(
      [
        {
          id: "p1",
          shop_id: "shop-a",
          name: "Sugar 1kg",
          unit: "kg",
          sku_code: "",
          buying_price: 4200,
          selling_price: 5000,
          stock_qty: 18,
          is_fast_mover: true,
          photo_url: "",
          active: true,
          server_updated_at: "2026-11-25T00:00:00Z",
        },
        {
          id: "p2",
          shop_id: "shop-a",
          name: "Bar soap",
          unit: "pc",
          sku_code: "",
          buying_price: 2500,
          selling_price: 3500,
          stock_qty: 24,
          is_fast_mover: true,
          photo_url: "",
          active: true,
          server_updated_at: "2026-11-25T00:00:00Z",
        },
      ],
      "shop-b",
      ["sugar 1kg"],
    );

    expect(plan).toHaveLength(1);
    expect(plan[0]?.name).toBe("Bar soap");
    expect(plan[0]?.shop_id).toBe("shop-b");
    expect(plan[0]?.stock_qty).toBe(0);
  });

  it("computes integer dashboard KPIs accurately", () => {
    const summary = summarizeDashboard({
      sales: [
        {
          id: "s1",
          created_at: "2026-11-25T10:00:00Z",
          status: "completed",
          total: 10000,
          tenders: [{ method: "cash", amount: 10000 }],
          lines: [
            {
              productId: "p1",
              name: "Sugar 1kg",
              qty: 2,
              unitPrice: 5000,
              buyingPriceSnapshot: 4200,
              lineTotal: 10000,
            },
          ],
        },
        {
          id: "s2",
          created_at: "2026-11-25T11:00:00Z",
          status: "voided",
          total: 5000,
          tenders: [{ method: "cash", amount: 5000 }],
          lines: [],
        },
      ],
      expenses: [{ amount: 1200 }],
      products: [{ id: "p1", name: "Sugar 1kg", stock_qty: 2, reorder_level: 5 }],
      batches: [],
      customers: [{ balance: 15000 }],
    });

    expect(summary.totalRevenue).toBe(10000);
    expect(summary.orderCount).toBe(1);
    expect(summary.averageBasket).toBe(10000);
    expect(summary.totalExpenses).toBe(1200);
    // Gross profit = (5000 - 4200) * 2 = 1600; minus 1200 expense = 400
    expect(summary.netEstimate).toBe(400);
    expect(summary.totalDeni).toBe(15000);
    expect(summary.lowStockCount).toBe(1);
  });

  it("validates expense, purchase and reserved order inputs", () => {
    expect(validateExpenseInput({ category: "Rent", amount: 50000, description: "" }).ok).toBe(true);
    expect(validateExpenseInput({ category: "Rent", amount: 0, description: "" }).ok).toBe(false);

    const purchase = validatePurchaseInput({
      supplierName: "Kisenyi Wholesale",
      items: [{ name: "Posho 50kg", qty: 2, unit_cost: 95000 }],
      paid: 100000,
    });
    expect(purchase).toEqual({ ok: true, total: 190000 });

    const reserved = validateReservedOrderInput({
      customerName: "Kato",
      lines: [{ name: "Sofa", qty: 1, unit_price: 800000 }],
      depositUgx: 200000,
    });
    expect(reserved).toEqual({ ok: true, total: 800000 });
  });

  it("persists Dexie v3 tables (expenses, suppliers, purchases, reserved_orders)", async () => {
    await db.expenses.add({
      id: "e1",
      shop_id: "s1",
      category: "Transport",
      amount: 5000,
      description: "Boda",
      user_id: "u1",
      incurred_at: "2026-11-25T09:00:00Z",
    });
    await db.suppliers.add({
      id: "sup1",
      shop_id: "s1",
      name: "Kisenyi Depot",
      phone: "0791149592",
      email: "",
      balance: 90000,
      created_at: "2026-11-25T09:00:00Z",
    });
    await db.purchases.add({
      id: "pur1",
      shop_id: "s1",
      supplier_id: "sup1",
      supplier_name: "Kisenyi Depot",
      items: [{ name: "Sugar", qty: 1, unit_cost: 180000, line_total: 180000 }],
      total: 180000,
      paid: 90000,
      status: "received",
      note: "",
      created_at: "2026-11-25T09:00:00Z",
    });
    await db.reserved_orders.add({
      id: "res1",
      shop_id: "s1",
      customer_id: null,
      customer_name: "Grace",
      customer_phone: "0791149592",
      lines: [{ name: "Table", qty: 1, unit_price: 300000, line_total: 300000 }],
      total: 300000,
      deposit_ugx: 100000,
      status: "held",
      created_at: "2026-11-25T09:00:00Z",
    });

    expect(await db.expenses.count()).toBe(1);
    expect(await db.suppliers.count()).toBe(1);
    expect(await db.purchases.count()).toBe(1);
    expect(await db.reserved_orders.count()).toBe(1);
  });

  it("includes every Phase 4 route", () => {
    const root = process.cwd();
    for (const rel of [
      "src/app/app/products/bulk-csv/page.tsx",
      "src/app/app/products/copy-branch/page.tsx",
      "src/app/app/reserved-orders/page.tsx",
      "src/app/app/expenses/page.tsx",
      "src/app/app/purchases/page.tsx",
      "src/app/app/warehouse/page.tsx",
    ]) {
      expect(existsSync(join(root, rel))).toBe(true);
    }
  });
});
