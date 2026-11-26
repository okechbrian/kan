import { db } from "./db";
import { generateId } from "./uuid";
import { requireOwner, requireOpenShift, getSession } from "./session";
import { syncNow } from "./sync";

export async function recordDraw(opts: {
  shopId: string;
  shiftId: string;
  userId: string;
  amount: number;
  reason: string;
}): Promise<{ id: string }> {
  const { shopId, shiftId, userId, amount, reason } = opts;
  await requireOwner(userId);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer");
  }
  if (!reason.trim()) {
    throw new Error("Reason is required");
  }

  const id = generateId();
  await db.transaction("rw", [db.shifts, db.shops, db.users, db.cash_movements], async () => {
    await requireOwner(userId, shopId);
    await requireOpenShift(shopId, shiftId, userId);
    await db.cash_movements.add({ id, shop_id: shopId, shift_id: shiftId, type: "draw", amount, reason: reason.trim(), user_id: userId, created_at: new Date().toISOString() });
  });
  void syncNow();
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

export async function closeShift(opts: { shiftId: string; countedCash: number; userId?: string }): Promise<{ expected: number; variance: number }> {
  if (!Number.isSafeInteger(opts.countedCash) || opts.countedCash < 0) throw new Error("Counted cash must be a whole number");
  const result = await db.transaction("rw", [db.shifts, db.sales, db.tenders, db.cash_movements, db.users, db.shops], async () => {
    const shift = await db.shifts.get(opts.shiftId);
    if (!shift) throw new Error("Shift not found");
    const actor = opts.userId ?? getSession()?.userId;
    if (!actor) throw new Error("Unlock the till first");
    await requireOpenShift(shift.shop_id, shift.id, actor);
    const expected = await expectedCash(shift.id);
    const variance = opts.countedCash - expected;
    await db.shifts.update(shift.id, { closed_at: new Date().toISOString(), counted_cash: opts.countedCash, expected_cash: expected, variance, status: "closed" });
    return { expected, variance };
  });
  void syncNow();
  return result;
}

/** Cash expenses post to both the expense journal and the active till exactly once. */
export async function recordExpense(opts: { shopId: string; userId: string; category: string; amount: number; description: string; method: "cash" | "mtn_momo" | "airtel_money" }) {
  if (!Number.isSafeInteger(opts.amount) || opts.amount <= 0) throw new Error("Amount must be a positive integer");
  if (!opts.category.trim() || !["cash", "mtn_momo", "airtel_money"].includes(opts.method)) throw new Error("Select an expense category and payment method");
  const id = generateId();
  await db.transaction("rw", [db.expenses, db.cash_movements, db.shifts, db.users, db.shops], async () => {
    await requireOwner(opts.userId, opts.shopId);
    const now = new Date().toISOString();
    if (opts.method === "cash") {
      const shift = await db.shifts.where("[shop_id+status]").equals([opts.shopId, "open"]).first();
      if (!shift) throw new Error("Open the till before recording a cash expense");
      await db.cash_movements.add({ id, shop_id: opts.shopId, shift_id: shift.id, type: "expense", amount: opts.amount, reason: `${opts.category}: ${opts.description}`, user_id: opts.userId, created_at: now });
    }
    await db.expenses.add({ id, shop_id: opts.shopId, category: opts.category, amount: opts.amount, description: opts.description, user_id: opts.userId, incurred_at: now });
  });
  void syncNow();
  return { id };
}
