import Dexie from "dexie";
import { db } from "./db";
import { generateId } from "./uuid";
import { requireOwner, requireOpenShift } from "./session";
import { syncNow } from "./sync";
import { expectedCash } from "./till";

export type SaleLineInput = {
  productId: string;
  qty: number;
  unitPrice: number;
};

export type TenderInput = {
  method: "cash" | "mtn_momo" | "airtel_money" | "credit";
  amount: number;
  /** Cash only — actual bills received */
  amountTendered?: number;
};

export type RecordSaleOpts = {
  shopId: string;
  shiftId: string;
  userId: string;
  lines: SaleLineInput[];
  tenders: TenderInput[];
  customerId?: string | null;
  note?: string;
};

function validateSale(opts: RecordSaleOpts): number {
  const { lines, tenders } = opts;

  if (lines.length === 0) {
    throw new Error("Cart is empty");
  }

  if (tenders.length === 0) {
    throw new Error("No payment method selected");
  }

  for (const line of lines) {
    if (!Number.isSafeInteger(line.qty) || line.qty <= 0) {
      throw new Error("Quantity must be a positive integer");
    }
    if (!Number.isSafeInteger(line.unitPrice) || line.unitPrice < 0) {
      throw new Error("Unit price must be an integer");
    }
  }

  for (const tender of tenders) {
    if (!Number.isSafeInteger(tender.amount) || tender.amount <= 0) {
      throw new Error("Tender amount must be a positive integer");
    }
    if (tender.method === "cash" && tender.amountTendered !== undefined) {
      if (!Number.isSafeInteger(tender.amountTendered)) {
        throw new Error("Amount tendered must be an integer");
      }
      if (tender.amountTendered < tender.amount) {
        throw new Error("Amount tendered is less than tender amount");
      }
    }
  }

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  if (!Number.isSafeInteger(total)) {
    throw new Error("Sale total must be an integer");
  }

  const tenderSum = tenders.reduce((s, t) => s + t.amount, 0);
  if (tenderSum !== total) {
    throw new Error(
      `Payment ${tenderSum} does not match total ${total}`
    );
  }

  const hasCredit = tenders.some((t) => t.method === "credit");
  if (hasCredit && !opts.customerId) {
    throw new Error("Credit sale requires a customer");
  }

  return total;
}

export async function recordSale(
  opts: RecordSaleOpts
): Promise<{ saleId: string; total: number; change: number }> {
  const { shopId, shiftId, userId, lines, tenders, customerId, note } = opts;

  const total = validateSale(opts);

  const tables: Dexie.Table[] = [
    db.sales,
    db.sale_lines,
    db.tenders,
    db.stock_movements,
    db.products, db.shifts, db.users, db.shops, db.customers,
  ];
  if (tenders.some((t) => t.method === "credit")) {
    tables.push(db.deni_ledger);
  }

  const saleId = generateId();
  const now = new Date().toISOString();
  let cashChange = 0;
  const saleLines: {
    id: string;
    sale_id: string;
    product_id: string;
    qty: number;
    unit_price: number;
    line_total: number;
    buying_price_snapshot: number;
  }[] = [];
  const stockMovements: {
    id: string;
    shop_id: string;
    product_id: string;
    type: "sale";
    qty_delta: number;
    reason: string;
    user_id: string;
    created_at: string;
    ref_id: string;
  }[] = [];

  await db.transaction("rw", tables, async () => {
    await requireOpenShift(shopId, shiftId, userId);
    const actor = await db.users.get(userId);
    if (customerId) {
      const customer = await db.customers.get(customerId);
      if (!customer || customer.shop_id !== shopId) throw new Error("Customer not found");
    }
    for (const line of lines) {
      const product = await db.products.get(line.productId);
      if (!product?.active || product.shop_id !== shopId) {
        throw new Error("Product not found");
      }

      if (actor?.role !== "owner" && line.unitPrice !== product.selling_price) throw new Error("Owner only: price override");

      saleLines.push({
        id: generateId(),
        sale_id: saleId,
        product_id: line.productId,
        qty: line.qty,
        unit_price: line.unitPrice,
        line_total: line.unitPrice * line.qty,
        buying_price_snapshot: product.buying_price,
      });

      stockMovements.push({
        id: generateId(),
        shop_id: shopId,
        product_id: line.productId,
        type: "sale" as const,
        qty_delta: -line.qty,
        reason: "",
        user_id: userId,
        created_at: now,
        ref_id: saleId,
      });
    }

    await db.sales.add({
      id: saleId,
      shop_id: shopId,
      shift_id: shiftId,
      user_id: userId,
      customer_id: customerId ?? null,
      created_at: now,
      status: "completed",
      void_reason: "",
      total,
      note: note ?? "",
    });

    await db.sale_lines.bulkAdd(saleLines);

    for (const tender of tenders) {
      const isCash = tender.method === "cash";
      const change = isCash
        ? (tender.amountTendered ?? tender.amount) - tender.amount
        : 0;
      if (isCash) cashChange += change;

      await db.tenders.add({
        id: generateId(),
        sale_id: saleId,
        method: tender.method,
        amount: tender.amount,
        amount_tendered: tender.amountTendered ?? tender.amount,
        change,
      });

      if (tender.method === "credit" && customerId) {
        await db.deni_ledger.add({
          id: generateId(),
          shop_id: shopId,
          customer_id: customerId,
          type: "sale_credit",
          amount: tender.amount,
          sale_id: saleId,
          user_id: userId,
          created_at: now,
          note: "",
        });
        await db.customers
          .where("id")
          .equals(customerId)
          .modify((c) => {
            c.balance += tender.amount;
          });
      }
    }

    await db.stock_movements.bulkAdd(stockMovements);

    for (const line of lines) {
      await db.products
        .where("id")
        .equals(line.productId)
        .modify((p) => {
          p.stock_qty -= line.qty;
        });
    }
  });

  void syncNow();

  return { saleId, total, change: cashChange };
}

export async function recordDeniCollection(opts: {
  shopId: string; shiftId: string; userId: string; customerId: string;
  amount: number; method: "cash" | "mtn_momo" | "airtel_money"; note?: string;
}): Promise<{ entryId: string }> {
  const { shopId, shiftId, userId, customerId, amount, method, note } = opts;
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Amount must be a positive integer");
  if (!["cash", "mtn_momo", "airtel_money"].includes(method)) throw new Error("Invalid collection method");
  const entryId = generateId();
  const now = new Date().toISOString();
  await db.transaction("rw", [db.deni_ledger, db.customers, db.cash_movements, db.users, db.shops, db.shifts], async () => {
    await requireOpenShift(shopId, shiftId, userId);
    const customer = await db.customers.get(customerId);
    if (!customer || customer.shop_id !== shopId) throw new Error("Customer not found");
    if (amount > customer.balance) throw new Error("Amount is more than they owe");
    await db.deni_ledger.add({ id: entryId, shop_id: shopId, customer_id: customerId, type: "collection", amount: -amount, sale_id: "", user_id: userId, created_at: now, note: note ?? "" });
    await db.customers.update(customerId, { balance: customer.balance - amount });
    if (method === "cash") await db.cash_movements.add({ id: generateId(), shop_id: shopId, shift_id: shiftId, type: "collection_cash", amount, reason: `Deni collection from ${customer.name}`, user_id: userId, created_at: now });
  });
  void syncNow();
  return { entryId };
}

export async function voidSale(opts: { saleId: string; reason: string; userId: string }): Promise<void> {
  const { saleId, reason, userId } = opts;
  if (!reason.trim()) throw new Error("Void reason is required");
  await db.transaction("rw", [db.users, db.shops, db.sales, db.sale_lines, db.tenders, db.stock_movements, db.products, db.deni_ledger, db.customers, db.shifts, db.cash_movements], async () => {
    const sale = await db.sales.get(saleId);
    if (!sale) throw new Error("Sale not found");
    await requireOwner(userId, sale.shop_id);
    if (sale.status === "voided") throw new Error("Sale is already voided");
    const lines = await db.sale_lines.where("sale_id").equals(saleId).toArray();
    const tenders = await db.tenders.where("sale_id").equals(saleId).toArray();
    const now = new Date().toISOString();
    await db.sales.update(saleId, { status: "voided", void_reason: reason.trim() });
    for (const line of lines) {
      const product = await db.products.get(line.product_id);
      if (!product || product.shop_id !== sale.shop_id) throw new Error("Product not found");
      await db.stock_movements.add({ id: generateId(), shop_id: sale.shop_id, product_id: line.product_id, type: "void", qty_delta: line.qty, reason: reason.trim(), user_id: userId, created_at: now, ref_id: saleId });
      await db.products.update(product.id, { stock_qty: product.stock_qty + line.qty });
    }
    const credit = tenders.filter((t) => t.method === "credit").reduce((sum, t) => sum + t.amount, 0);
    if (credit && sale.customer_id) {
      const customer = await db.customers.get(sale.customer_id);
      if (!customer || customer.shop_id !== sale.shop_id) throw new Error("Customer not found");
      await db.deni_ledger.add({ id: generateId(), shop_id: sale.shop_id, customer_id: customer.id, type: "void", amount: -credit, sale_id: saleId, user_id: userId, created_at: now, note: reason.trim() });
      await db.customers.update(customer.id, { balance: customer.balance - credit });
    }
    const shift = await db.shifts.get(sale.shift_id);
    if (shift?.status === "closed") {
      const expected = await expectedCash(shift.id);
      await db.shifts.update(shift.id, { expected_cash: expected, variance: (shift.counted_cash ?? 0) - expected });
    }
  });
  void syncNow();
}
