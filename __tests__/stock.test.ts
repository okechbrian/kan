import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed";
import { generateId } from "../src/lib/uuid";
import { recordSale, voidSale } from "../src/lib/sale";
import { receiveStock, adjustStock } from "../src/lib/stock";
import { recordDraw, expectedCash } from "../src/lib/till";
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

describe("Receive stock", () => {
  it("increases qty by 10 and updates last buying price", async () => {
    const { shop, user, products } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const before = sugar.stock_qty;

    await receiveStock({
      shopId: shop.id,
      userId: user.id,
      supplier: "Kikuubo",
      lines: [{ productId: sugar.id, qty: 10, unitCost: 4300 }],
    });

    const updated = await db.products.get(sugar.id);
    expect(updated!.stock_qty).toBe(before + 10);
    expect(updated!.buying_price).toBe(4300);

    const moves = await db.stock_movements
      .where("product_id")
      .equals(sugar.id)
      .filter((m) => m.type === "receive" && m.reason === "Kikuubo")
      .toArray();
    expect(moves).toHaveLength(1);
    expect(moves[0].qty_delta).toBe(10);
  });

  it("rejects attendant receive", async () => {
    const { shop, products } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const attId = generateId();
    await db.users.add({
      id: attId,
      business_id: shop.business_id,
      shop_id: shop.id,
      name: "Attendant",
      role: "attendant",
      pin_hash: await hashPin("5555"),
      active: true,
      server_updated_at: new Date().toISOString(),
    });

    await expect(
      receiveStock({
        shopId: shop.id,
        userId: attId,
        lines: [{ productId: sugar.id, qty: 10, unitCost: 4300 }],
      })
    ).rejects.toThrow("Owner only");
  });
});

describe("Adjust stock", () => {
  it("sets stock to counted qty and writes a movement", async () => {
    const { shop, user, products } = await setup();
    const soap = products.find((p) => p.name === "Bar soap")!;

    await adjustStock({
      shopId: shop.id,
      userId: user.id,
      productId: soap.id,
      countedQty: 8,
      reason: "Theft",
    });

    const updated = await db.products.get(soap.id);
    expect(updated!.stock_qty).toBe(8);
    const moves = await db.stock_movements
      .where("product_id")
      .equals(soap.id)
      .filter((m) => m.type === "adjust")
      .toArray();
    expect(moves[0].qty_delta).toBe(8 - soap.stock_qty);
    expect(moves[0].reason).toBe("Theft");
  });
});

describe("Owner draw", () => {
  it("reduces expected cash", async () => {
    const { shop, user, shiftId } = await setup();
    expect(await expectedCash(shiftId)).toBe(50000);

    await recordDraw({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      amount: 10000,
      reason: "lunch",
    });

    expect(await expectedCash(shiftId)).toBe(40000);
  });

  it("float 50k + cash sales 80k − draw 10k = 120k", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const qty = 16;
    expect(sugar.selling_price * qty).toBe(80000);

    await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: sugar.id, qty, unitPrice: sugar.selling_price }],
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
  });
});

describe("Void sale", () => {
  it("restores stock", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const before = sugar.stock_qty;

    const result = await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: sugar.id, qty: 3, unitPrice: sugar.selling_price }],
      tenders: [
        {
          method: "cash",
          amount: sugar.selling_price * 3,
          amountTendered: sugar.selling_price * 3,
        },
      ],
    });

    await voidSale({
      saleId: result.saleId,
      reason: "Customer returned",
      userId: user.id,
    });

    const after = await db.products.get(sugar.id);
    expect(after!.stock_qty).toBe(before);
    const sale = await db.sales.get(result.saleId);
    expect(sale!.status).toBe("voided");
  });

  it("reverses deni for a credit sale", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const customerId = generateId();
    await db.customers.add({
      id: customerId,
      shop_id: shop.id,
      name: "John",
      phone: "",
      notes: "",
      balance: 0,
      server_updated_at: new Date().toISOString(),
    });

    const result = await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: sugar.id, qty: 1, unitPrice: sugar.selling_price }],
      tenders: [{ method: "credit", amount: sugar.selling_price }],
      customerId,
    });

    await voidSale({
      saleId: result.saleId,
      reason: "Wrong item",
      userId: user.id,
    });

    const customer = await db.customers.get(customerId);
    expect(customer!.balance).toBe(0);
  });

  it("rejects void without reason and double void", async () => {
    const { shop, user, products, shiftId } = await setup();
    const sugar = products.find((p) => p.name === "Sugar 1kg")!;
    const result = await recordSale({
      shopId: shop.id,
      shiftId,
      userId: user.id,
      lines: [{ productId: sugar.id, qty: 1, unitPrice: sugar.selling_price }],
      tenders: [
        {
          method: "cash",
          amount: sugar.selling_price,
          amountTendered: sugar.selling_price,
        },
      ],
    });

    await expect(
      voidSale({ saleId: result.saleId, reason: "", userId: user.id })
    ).rejects.toThrow("Void reason is required");

    await voidSale({
      saleId: result.saleId,
      reason: "First",
      userId: user.id,
    });
    await expect(
      voidSale({ saleId: result.saleId, reason: "Second", userId: user.id })
    ).rejects.toThrow("Sale is already voided");
  });
});
