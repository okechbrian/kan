import Dexie from "dexie";
import { db } from "./db";
import { generateId } from "./uuid";
import { requireOwner } from "./session";
import { queueAndMaybeSync } from "./sync";

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
    if (!Number.isInteger(line.qty) || line.qty <= 0) {
      throw new Error("Quantity must be a positive integer");
    }
    if (!Number.isInteger(line.unitPrice) || line.unitPrice < 0) {
      throw new Error("Unit price must be an integer");
    }
  }

  for (const tender of tenders) {
    if (!Number.isInteger(tender.amount) || tender.amount <= 0) {
      throw new Error("Tender amount must be a positive integer");
    }
    if (tender.method === "cash" && tender.amountTendered !== undefined) {
      if (!Number.isInteger(tender.amountTendered)) {
        throw new Error("Amount tendered must be an integer");
      }
      if (tender.amountTendered < tender.amount) {
        throw new Error("Amount tendered is less than tender amount");
      }
    }
  }

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  if (!Number.isInteger(total)) {
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
    db.products,
  ];
  if (tenders.some((t) => t.method === "credit")) {
    tables.push(db.deni_ledger, db.customers);
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

    for (const line of lines) {
      const product = await db.products.get(line.productId);
      if (!product) {
        throw new Error("Product not found");
      }

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
      if (isCash) cashChange = change;

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

  const saleRow = await db.sales.get(saleId);

  const queued: any[] = [
    { table: "sales", row_id: saleId, op: "insert" as const, payload: saleRow },
    ...saleLines.map((l) => ({
      table: "sale_lines",
      row_id: l.id,
      op: "insert" as const,
      payload: l,
    })),
    ...stockMovements.map((m) => ({
      table: "stock_movements",
      row_id: m.id,
      op: "insert" as const,
      payload: m,
    })),
  ];
  const tenderRows = await db.tenders.where("sale_id").equals(saleId).toArray();
  for (const t of tenderRows) {
    queued.push({
      table: "tenders",
      row_id: t.id,
      op: "insert",
      payload: t,
    });
  }
  void queueAndMaybeSync(queued);


  return { saleId, total, change: cashChange };
}

export async function recordDeniCollection(opts: {
  shopId: string;
  shiftId: string;
  userId: string;
  customerId: string;
  amount: number;
  method: "cash" | "mtn_momo" | "airtel_money";
  note?: string;
}): Promise<{ entryId: string }> {
  const { shopId, shiftId, userId, customerId, amount, method, note } = opts;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }

  const customer = await db.customers.get(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }
  if (amount > customer.balance) {
    throw new Error("Amount is more than they owe");
  }

  const tables: Dexie.Table[] = [db.deni_ledger, db.customers];
  if (method === "cash") {
    tables.push(db.cash_movements);
  }

  const entryId = generateId();
  const now = new Date().toISOString();

  await db.transaction("rw", tables, async () => {
    await db.deni_ledger.add({
      id: entryId,
      shop_id: shopId,
      customer_id: customerId,
      type: "collection",
      amount: -amount,
      sale_id: "",
      user_id: userId,
      created_at: now,
      note: note ?? "",
    });

    await db.customers
      .where("id")
      .equals(customerId)
      .modify((c) => {
        c.balance -= amount;
      });

    if (method === "cash") {
      await db.cash_movements.add({
        id: generateId(),
        shop_id: shopId,
        shift_id: shiftId,
        type: "collection_cash",
        amount,
        reason: `Deni collection from ${customer.name}`,
        user_id: userId,
        created_at: now,
      });
    }
  });

  return { entryId };
}

export async function voidSale(opts: {
  saleId: string;
  reason: string;
  userId: string;
}): Promise<void> {
  const { saleId, reason, userId } = opts;

  if (!reason.trim()) {
    throw new Error("Void reason is required");
  }

  await requireOwner(userId);

  const sale = await db.sales.get(saleId);
  if (!sale) {
    throw new Error("Sale not found");
  }
  if (sale.status === "voided") {
    throw new Error("Sale is already voided");
  }

  const lines = await db.sale_lines
    .where("sale_id")
    .equals(saleId)
    .toArray();

  const tenders = await db.tenders
    .where("sale_id")
    .equals(saleId)
    .toArray();

  const hasCredit = tenders.some((t) => t.method === "credit");

  const tables: Dexie.Table[] = [
    db.sales,
    db.stock_movements,
    db.products,
  ];
  if (hasCredit) {
    tables.push(db.deni_ledger, db.customers);
  }

  const now = new Date().toISOString();

  await db.transaction("rw", tables, async () => {
    await db.sales.where("id").equals(saleId).modify((s) => {
      s.status = "voided";
      s.void_reason = reason.trim();
    });

    for (const line of lines) {
      await db.stock_movements.add({
        id: generateId(),
        shop_id: sale.shop_id,
        product_id: line.product_id,
        type: "void",
        qty_delta: line.qty,
        reason: reason.trim(),
        user_id: userId,
        created_at: now,
        ref_id: saleId,
      });

      await db.products
        .where("id")
        .equals(line.product_id)
        .modify((p) => {
          p.stock_qty += line.qty;
        });
    }

    if (hasCredit && sale.customer_id) {
      const creditTender = tenders.find((t) => t.method === "credit");
      if (creditTender) {
        await db.deni_ledger.add({
          id: generateId(),
          shop_id: sale.shop_id,
          customer_id: sale.customer_id,
          type: "void",
          amount: -creditTender.amount,
          sale_id: saleId,
          user_id: userId,
          created_at: now,
          note: reason.trim(),
        });

        await db.customers
          .where("id")
          .equals(sale.customer_id)
          .modify((c) => {
            c.balance -= creditTender.amount;
          });
      }
    }
  });
}
