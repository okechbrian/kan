import { expiryAlerts, stockAlerts, type BatchLike, type ProductLike } from "../analytics/alerts";
import { averageBasket, completedSales, salesByDay, type SaleLike } from "../analytics/sales";
import type { Product } from "../db";
import { generateId } from "../uuid";

export type CsvProductRow = {
  name: string;
  unit: string;
  buying_price: number;
  selling_price: number;
  stock_qty: number;
  barcode: string;
  brand: string;
};

export function parseProductsCsv(csvText: string): {
  rows: CsvProductRow[];
  errors: string[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows: CsvProductRow[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const parts = line.split(",").map((cell) => cell.trim());
    if (index === 0 && parts[0]?.toLowerCase() === "name") {
      return;
    }
    const lineNum = index + 1;
    const [name = "", unit = "pc", buyRaw = "0", sellRaw = "", qtyRaw = "0", barcode = "", brand = ""] =
      parts;

    if (!name) {
      errors.push(`Line ${lineNum}: product name is required.`);
      return;
    }
    const buyingPrice = Number(buyRaw);
    const sellingPrice = Number(sellRaw);
    const stockQty = Number(qtyRaw || "0");

    if (!Number.isInteger(buyingPrice) || buyingPrice < 0) {
      errors.push(`Line ${lineNum} (${name}): buying price must be a non-negative integer UGX.`);
      return;
    }
    if (!Number.isInteger(sellingPrice) || sellingPrice <= 0) {
      errors.push(`Line ${lineNum} (${name}): selling price must be a positive integer UGX.`);
      return;
    }
    if (!Number.isInteger(stockQty) || stockQty < 0) {
      errors.push(`Line ${lineNum} (${name}): stock quantity must be a non-negative integer.`);
      return;
    }

    rows.push({
      name,
      unit: unit || "pc",
      buying_price: buyingPrice,
      selling_price: sellingPrice,
      stock_qty: stockQty,
      barcode,
      brand,
    });
  });

  return { rows, errors };
}

export function buildBranchCopyPlan(
  sourceProducts: readonly Product[],
  targetShopId: string,
  existingNames: readonly string[],
): Product[] {
  const existingSet = new Set(existingNames.map((n) => n.trim().toLowerCase()));
  const now = new Date().toISOString();

  return sourceProducts
    .filter((product) => !existingSet.has(product.name.trim().toLowerCase()))
    .map((product) => ({
      ...product,
      id: generateId(),
      shop_id: targetShopId,
      stock_qty: 0,
      warehouse_id: undefined,
      server_updated_at: now,
    }));
}

export function summarizeDashboard(input: {
  sales: SaleLike[];
  expenses: { amount: number }[];
  products: ProductLike[];
  batches: BatchLike[];
  customers: { balance: number }[];
}) {
  const completed = completedSales(input.sales);
  const totalRevenue = completed.reduce((sum, sale) => sum + sale.total, 0);
  const orderCount = completed.length;
  const avgBasket = averageBasket(completed);
  const totalExpenses = input.expenses.reduce((sum, item) => sum + item.amount, 0);
  const cogs = completed.reduce(
    (sum, sale) =>
      sum +
      sale.lines.reduce(
        (lineSum, line) => lineSum + line.buyingPriceSnapshot * line.qty,
        0,
      ),
    0,
  );
  const netEstimate = totalRevenue - cogs - totalExpenses;
  const totalDeni = input.customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
  const lowStockCount = stockAlerts(input.products).length;
  const expiringCount = expiryAlerts(input.batches).length;
  const dailySeries = salesByDay(completed).slice(-7);

  return {
    totalRevenue,
    orderCount,
    averageBasket: avgBasket,
    totalExpenses,
    netEstimate,
    totalDeni,
    lowStockCount,
    expiringCount,
    dailySeries,
  };
}

export function validateExpenseInput(input: {
  category: string;
  amount: number;
  description: string;
}) {
  const category = input.category.trim();
  const description = input.description.trim();
  if (!category) return { ok: false as const, error: "Category is required." };
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return { ok: false as const, error: "Amount must be a positive integer in UGX." };
  }
  return {
    ok: true as const,
    value: { category, amount: input.amount, description },
  };
}

export function validatePurchaseInput(input: {
  supplierName: string;
  items: { name: string; qty: number; unit_cost: number }[];
  paid: number;
}) {
  const supplierName = input.supplierName.trim();
  if (!supplierName) {
    return { ok: false as const, error: "Supplier name is required." };
  }
  if (input.items.length === 0) {
    return { ok: false as const, error: "Add at least one item." };
  }
  let total = 0;
  for (const item of input.items) {
    if (!item.name.trim()) {
      return { ok: false as const, error: "Each item needs a product name." };
    }
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      return { ok: false as const, error: "Quantity must be a positive integer." };
    }
    if (!Number.isInteger(item.unit_cost) || item.unit_cost < 0) {
      return { ok: false as const, error: "Unit cost must be an integer in UGX." };
    }
    total += item.qty * item.unit_cost;
  }
  if (!Number.isInteger(input.paid) || input.paid < 0 || input.paid > total) {
    return { ok: false as const, error: "Paid amount must be an integer between 0 and total." };
  }
  return { ok: true as const, total };
}

export function validateReservedOrderInput(input: {
  customerName: string;
  lines: { name: string; qty: number; unit_price: number }[];
  depositUgx: number;
}) {
  const customerName = input.customerName.trim();
  if (!customerName) {
    return { ok: false as const, error: "Customer name is required." };
  }
  if (input.lines.length === 0) {
    return { ok: false as const, error: "Add at least one line item." };
  }
  let total = 0;
  for (const line of input.lines) {
    if (!line.name.trim()) {
      return { ok: false as const, error: "Item name is required." };
    }
    if (!Number.isInteger(line.qty) || line.qty <= 0) {
      return { ok: false as const, error: "Quantity must be a positive integer." };
    }
    if (!Number.isInteger(line.unit_price) || line.unit_price <= 0) {
      return { ok: false as const, error: "Unit price must be a positive integer UGX." };
    }
    total += line.qty * line.unit_price;
  }
  if (!Number.isInteger(input.depositUgx) || input.depositUgx < 0 || input.depositUgx > total) {
    return { ok: false as const, error: "Deposit must be an integer between 0 and order total." };
  }
  return { ok: true as const, total };
}
