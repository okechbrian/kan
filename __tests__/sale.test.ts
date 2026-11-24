import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed";
import { generateId } from "../src/lib/uuid";
import { recordSale, recordDeniCollection } from "../src/lib/sale";

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

async function createCustomer(shopId: string, name: string) {
  const id = generateId();
  await db.customers.add({
    id,
    shop_id: shopId,
    name,
    phone: "",
    notes: "",
    balance: 0,
    server_updated_at: new Date().toISOString(),
  });
  return id;
}

describe("Cash sale", () => {
  it("reduces stock for each line item", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const soap = products.find((p) => p.name === "Bar soap")!;
    const total = sugar.selling_price * 2 + soap.selling_price * 3;

    await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [
        { productId: sugar.id, qty: 2, unitPrice: sugar.selling_price },
        { productId: soap.id, qty: 3, unitPrice: soap.selling_price },
      ],
      tenders: [{ method: "cash", amount: total, amountTendered: total }],
    });

    const updatedSugar = await db.products.get(sugar.id);
    const updatedSoap = await db.products.get(soap.id);
    expect(updatedSugar!.stock_qty).toBe(sugar.stock_qty - 2);
    expect(updatedSoap!.stock_qty).toBe(soap.stock_qty - 3);

    const movements = await db.stock_movements
      .where("type")
      .equals("sale")
      .toArray();
    expect(movements).toHaveLength(2);
  });

  it("calculates change as tendered minus total", async () => {
    const { shop, user, products, shiftId } = await setup();
    const soda = products.find((p) => p.name === "Soda 500ml")!;

    const result = await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: soda.id, qty: 1, unitPrice: soda.selling_price }],
      tenders: [{ method: "cash", amount: soda.selling_price, amountTendered: 2000 }],
    });

    expect(result.total).toBe(1500);
    expect(result.change).toBe(500);

    const tender = await db.tenders
      .where("sale_id")
      .equals(result.saleId)
      .first();
    expect(tender!.amount).toBe(1500);
    expect(tender!.amount_tendered).toBe(2000);
    expect(tender!.change).toBe(500);
    expect(tender!.method).toBe("cash");
  });

  it("records exact cash with change = 0", async () => {
    const { shop, user, products, shiftId } = await setup();
    const water = products.find((p) => p.name === "Water 500ml")!;

    const result = await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: water.id, qty: 1, unitPrice: water.selling_price }],
      tenders: [{ method: "cash", amount: water.selling_price, amountTendered: water.selling_price }],
    });

    expect(result.change).toBe(0);
  });

  it("snapshots buying price and allows negative stock", async () => {
    const { shop, user, products, shiftId } = await setup();
    const eggs = products.find((p) => p.name === "Eggs")!;
    const total = eggs.selling_price * (eggs.stock_qty + 5);

    await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [
        { productId: eggs.id, qty: eggs.stock_qty + 5, unitPrice: eggs.selling_price },
      ],
      tenders: [{ method: "cash", amount: total, amountTendered: total }],
    });

    const updated = await db.products.get(eggs.id);
    expect(updated!.stock_qty).toBe(-5);

    const line = (await db.sale_lines.toArray())[0];
    expect(line.buying_price_snapshot).toBe(eggs.buying_price);
  });

  it("rejects tender below total", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;

    await expect(
      recordSale({
        shopId: shop.id,
        shiftId,
        userId: user.id,
        lines: [{ productId: sugar.id, qty: 1, unitPrice: sugar.selling_price }],
        tenders: [{ method: "cash", amount: 1000, amountTendered: 1000 }],
      })
    ).rejects.toThrow("Payment 1000 does not match total");
  });
});

describe("Credit sale", () => {
  it("increases customer balance and creates deni entry", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const customerId = await createCustomer(shop.id, "John");

    const result = await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: sugar.id, qty: 1, unitPrice: sugar.selling_price }],
      tenders: [{ method: "credit", amount: sugar.selling_price }],
      customerId,
    });

    const customer = await db.customers.get(customerId);
    expect(customer!.balance).toBe(sugar.selling_price);

    const deni = await db.deni_ledger
      .where("customer_id")
      .equals(customerId)
      .toArray();
    expect(deni).toHaveLength(1);
    expect(deni[0].type).toBe("sale_credit");
    expect(deni[0].amount).toBe(sugar.selling_price);

    const sale = await db.sales.get(result.saleId);
    expect(sale!.customer_id).toBe(customerId);
  });

  it("rejects credit sale without customer", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;

    await expect(
      recordSale({
        shopId: shop.id,
        shiftId,
        userId: user.id,
        lines: [{ productId: sugar.id, qty: 1, unitPrice: sugar.selling_price }],
        tenders: [{ method: "credit", amount: sugar.selling_price }],
      })
    ).rejects.toThrow("Credit sale requires a customer");
  });
});

describe("Split pay", () => {
  it("accepts 10k cash + 5k momo on 15k sale", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const qty = 3;
    const total = sugar.selling_price * qty;

    const result = await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: sugar.id, qty, unitPrice: sugar.selling_price }],
      tenders: [
        { method: "cash", amount: 10000, amountTendered: 10000 },
        { method: "mtn_momo", amount: total - 10000 },
      ],
    });

    expect(result.total).toBe(total);

    const tenders = await db.tenders
      .where("sale_id")
      .equals(result.saleId)
      .toArray();
    expect(tenders).toHaveLength(2);
    expect(tenders.find((t) => t.method === "cash")!.amount).toBe(10000);
    expect(tenders.find((t) => t.method === "mtn_momo")!.amount).toBe(
      total - 10000
    );
  });

  it("rejects split that does not sum to total", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;

    await expect(
      recordSale({
        shopId: shop.id,
        shiftId,
        userId: user.id,
        lines: [{ productId: sugar.id, qty: 1, unitPrice: sugar.selling_price }],
        tenders: [
          { method: "cash", amount: 5000, amountTendered: 5000 },
          { method: "mtn_momo", amount: 5000 },
        ],
      })
    ).rejects.toThrow("does not match total");
  });
});

describe("Deni collection", () => {
  it("decreases customer balance and creates ledger entry", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const customerId = await createCustomer(shop.id, "Jane");

    await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: sugar.id, qty: 1, unitPrice: sugar.selling_price }],
      tenders: [{ method: "credit", amount: sugar.selling_price }],
      customerId,
    });

    const before = await db.customers.get(customerId);
    expect(before!.balance).toBe(sugar.selling_price);

    await recordDeniCollection({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      customerId,
      amount: 1000,
      method: "cash",
    });

    const after = await db.customers.get(customerId);
    expect(after!.balance).toBe(sugar.selling_price - 1000);

    const deni = await db.deni_ledger
      .where("customer_id")
      .equals(customerId)
      .toArray();
    expect(deni).toHaveLength(2);
    const collection = deni.find((d) => d.type === "collection")!;
    expect(collection.amount).toBe(-1000);

    const cash = await db.cash_movements.toArray();
    expect(cash).toHaveLength(1);
    expect(cash[0].type).toBe("collection_cash");
  });

  it("rejects collection exceeding balance", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const customerId = await createCustomer(shop.id, "Bob");

    await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: sugar.id, qty: 1, unitPrice: sugar.selling_price }],
      tenders: [{ method: "credit", amount: sugar.selling_price }],
      customerId,
    });

    await expect(
      recordDeniCollection({
        shopId: shop.id,
        shiftId,
        userId: user.id,
        customerId,
        amount: sugar.selling_price + 5000,
        method: "cash",
      })
    ).rejects.toThrow("Amount is more than they owe");

    const after = await db.customers.get(customerId);
    expect(after!.balance).toBe(sugar.selling_price);
  });

  it("accepts a full MoMo sale without a customer", async () => {
    const { shop, user, products, shiftId } = await setup();
    const water = products.find((p) => p.name === "Water 500ml")!;

    const result = await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: water.id, qty: 1, unitPrice: water.selling_price }],
      tenders: [{ method: "mtn_momo", amount: water.selling_price }],
    });

    const tender = await db.tenders
      .where("sale_id")
      .equals(result.saleId)
      .first();
    expect(tender!.method).toBe("mtn_momo");
    const sale = await db.sales.get(result.saleId);
    expect(sale!.customer_id).toBeNull();
  });
});
