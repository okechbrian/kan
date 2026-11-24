import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed";
import { exportBackup, importBackup } from "../src/lib/backup";

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

describe("Database", () => {
  it("can insert shop and product after seed", async () => {
    await seedDemoData();

    const shops = await db.shops.toArray();
    expect(shops).toHaveLength(1);
    expect(shops[0].name).toBe("Demo Duuka");
    expect(shops[0].shop_code).toBe("DUKA-DEMO");

    const products = await db.products.toArray();
    expect(products).toHaveLength(8);
    expect(products[0].shop_id).toBe(shops[0].id);
  });

  it("export then import restores products", async () => {
    await seedDemoData();

    const backup = await exportBackup();
    expect(backup.products).toHaveLength(8);

    await db.products.clear();
    const emptyProducts = await db.products.toArray();
    expect(emptyProducts).toHaveLength(0);

    await importBackup(backup);
    const restoredProducts = await db.products.toArray();
    expect(restoredProducts).toHaveLength(8);
    const names = restoredProducts.map((p) => p.name).sort();
    expect(names).toContain("Sugar 1kg");
    expect(names).toContain("Cooking oil 1L");
    expect(names).toContain("Eggs");
  });
});
