import { db } from "./db";
import { generateId } from "./uuid";
import { requireOwner } from "./session";

export async function recordDraw(opts: {
  shopId: string;
  shiftId: string;
  userId: string;
  amount: number;
  reason: string;
}): Promise<{ id: string }> {
  const { shopId, shiftId, userId, amount, reason } = opts;
  await requireOwner(userId);

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }
  if (!reason.trim()) {
    throw new Error("Reason is required");
  }

  const shift = await db.shifts.get(shiftId);
  if (!shift || shift.shop_id !== shopId || shift.status !== "open") {
    throw new Error("Till is not open");
  }

  const id = generateId();
  await db.cash_movements.add({
    id,
    shop_id: shopId,
    shift_id: shiftId,
    type: "draw",
    amount,
    reason: reason.trim(),
    user_id: userId,
    created_at: new Date().toISOString(),
  });
  return { id };
}

/** Phase 4/5: expected cash in the box for an open or closed shift. */
export async function expectedCash(shiftId: string): Promise<number> {
  const shift = await db.shifts.get(shiftId);
  if (!shift) throw new Error("Shift not found");

  const sales = await db.sales
    .where("shift_id")
    .equals(shiftId)
    .filter((s) => s.status === "completed")
    .toArray();
  const saleIds = new Set(sales.map((s) => s.id));

  const tenders = await db.tenders.toArray();
  const cashSales = tenders
    .filter((t) => saleIds.has(t.sale_id) && t.method === "cash")
    .reduce((sum, t) => sum + t.amount, 0);

  const movements = await db.cash_movements
    .where("shift_id")
    .equals(shiftId)
    .toArray();
  const collections = movements
    .filter((m) => m.type === "collection_cash")
    .reduce((sum, m) => sum + m.amount, 0);
  const draws = movements
    .filter((m) => m.type === "draw")
    .reduce((sum, m) => sum + m.amount, 0);
  const expenses = movements
    .filter((m) => m.type === "expense")
    .reduce((sum, m) => sum + m.amount, 0);

  return shift.opening_float + cashSales + collections - draws - expenses;
}

export async function shiftCashBreakdown(shiftId: string): Promise<{
  float: number;
  cashSales: number;
  collections: number;
  draws: number;
  expenses: number;
  expected: number;
  momo: number;
  credit: number;
}> {
  const shift = await db.shifts.get(shiftId);
  if (!shift) throw new Error("Shift not found");

  const sales = await db.sales
    .where("shift_id")
    .equals(shiftId)
    .filter((s) => s.status === "completed")
    .toArray();
  const saleIds = new Set(sales.map((s) => s.id));
  const tenders = await db.tenders.toArray();

  let cashSales = 0;
  let momo = 0;
  let credit = 0;
  for (const t of tenders) {
    if (!saleIds.has(t.sale_id)) continue;
    if (t.method === "cash") cashSales += t.amount;
    else if (t.method === "mtn_momo" || t.method === "airtel_money")
      momo += t.amount;
    else if (t.method === "credit") credit += t.amount;
  }

  const movements = await db.cash_movements
    .where("shift_id")
    .equals(shiftId)
    .toArray();
  const collections = movements
    .filter((m) => m.type === "collection_cash")
    .reduce((sum, m) => sum + m.amount, 0);
  const draws = movements
    .filter((m) => m.type === "draw")
    .reduce((sum, m) => sum + m.amount, 0);
  const expenses = movements
    .filter((m) => m.type === "expense")
    .reduce((sum, m) => sum + m.amount, 0);

  const expected =
    shift.opening_float + cashSales + collections - draws - expenses;

  return {
    float: shift.opening_float,
    cashSales,
    collections,
    draws,
    expenses,
    expected,
    momo,
    credit,
  };
}

export async function closeShift(opts: {
  shiftId: string;
  countedCash: number;
}): Promise<{ expected: number; variance: number }> {
  const { shiftId, countedCash } = opts;
  if (!Number.isInteger(countedCash) || countedCash < 0) {
    throw new Error("Counted cash must be a whole number");
  }

  const shift = await db.shifts.get(shiftId);
  if (!shift) throw new Error("Shift not found");
  if (shift.status !== "open") throw new Error("Till is not open");

  const expected = await expectedCash(shiftId);
  const variance = countedCash - expected;
  const now = new Date().toISOString();

  await db.shifts
    .where("id")
    .equals(shiftId)
    .modify((s) => {
      s.closed_at = now;
      s.counted_cash = countedCash;
      s.expected_cash = expected;
      s.variance = variance;
      s.status = "closed";
    });

  return { expected, variance };
}
