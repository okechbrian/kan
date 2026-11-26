import { db } from "./db";
import { generateId } from "./uuid";
import { requireOwner } from "./session";
import { syncNow } from "./sync";

export type ReceiveLineInput = {
  productId: string;
  qty: number;
  unitCost: number;
};

export async function receiveStock(opts: {
  shopId: string;
  userId: string;
  lines: ReceiveLineInput[];
  supplier?: string;
}): Promise<{ receiveId: string }> {
  const { shopId, userId, lines, supplier } = opts;
  await requireOwner(userId, shopId);

  if (lines.length === 0) {
    throw new Error("Add at least one product");
  }
  for (const line of lines) {
    if (!Number.isSafeInteger(line.qty) || line.qty <= 0) {
      throw new Error("Quantity must be a positive integer");
    }
    if (!Number.isSafeInteger(line.unitCost) || line.unitCost < 0) {
      throw new Error("Unit cost must be an integer");
    }
  }

  const receiveId = generateId();
  const now = new Date().toISOString();
  const reason = supplier?.trim() || "Stock received";

  await db.transaction("rw", [db.stock_movements, db.products], async () => {
    for (const line of lines) {
      const product = await db.products.get(line.productId);
      if (!product || product.shop_id !== shopId) {
        throw new Error("Product not found");
      }
      await db.stock_movements.add({
        id: generateId(),
        shop_id: shopId,
        product_id: line.productId,
        type: "receive",
        qty_delta: line.qty,
        reason,
        user_id: userId,
        created_at: now,
        ref_id: receiveId,
      });
      await db.products
        .where("id")
        .equals(line.productId)
        .modify((p) => {
          p.stock_qty += line.qty;
          p.buying_price = line.unitCost;
        });
    }
  });

  void syncNow();
  return { receiveId };
}

export async function adjustStock(opts: {
  shopId: string;
  userId: string;
  productId: string;
  countedQty: number;
  reason: string;
}): Promise<void> {
  const { shopId, userId, productId, countedQty, reason } = opts;
  await requireOwner(userId, shopId);

  if (!Number.isSafeInteger(countedQty) || countedQty < 0) {
    throw new Error("Counted quantity must be a whole number");
  }
  if (!reason.trim()) {
    throw new Error("Reason is required");
  }

  const now = new Date().toISOString();
  await db.transaction("rw", [db.stock_movements, db.products], async () => {
    const product = await db.products.get(productId);
    if (!product || product.shop_id !== shopId) throw new Error("Product not found");
    const delta = countedQty - product.stock_qty;
    await db.stock_movements.add({
      id: generateId(),
      shop_id: shopId,
      product_id: productId,
      type: "adjust",
      qty_delta: delta,
      reason: reason.trim(),
      user_id: userId,
      created_at: now,
      ref_id: "",
    });
    await db.products
      .where("id")
      .equals(productId)
      .modify((p) => {
        p.stock_qty = countedQty;
      });
  });
  void syncNow();
}
