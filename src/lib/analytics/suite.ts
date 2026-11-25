export const REPORT_KEYS = [
  { id: "sales-report", label: "Sales report" },
  { id: "transaction-overview", label: "Transactions" },
  { id: "customer-overview", label: "Customers & deni" },
  { id: "expense-overview", label: "Expenses" },
  { id: "inventory-overview", label: "Inventory valuation" },
  { id: "purchase-overview", label: "Purchases" },
  { id: "refund-overview", label: "Refunds & voids" },
  { id: "staff-overview", label: "Staff sales" },
  { id: "warehouse-overview", label: "Warehouses" },
  { id: "warehouse-restock", label: "Restock queue" },
  { id: "warehouse-transfers", label: "Stock transfers" },
  { id: "view-statement", label: "Account statement" },
] as const;

export type ReportKey = (typeof REPORT_KEYS)[number]["id"];

export function inventoryValuation(
  products: readonly { stock_qty: number; buying_price: number; selling_price: number }[],
) {
  let costValue = 0;
  let retailValue = 0;
  let totalUnits = 0;
  for (const p of products) {
    const qty = Math.max(0, p.stock_qty);
    totalUnits += qty;
    costValue += qty * p.buying_price;
    retailValue += qty * p.selling_price;
  }
  return { costValue, retailValue, totalUnits };
}

export function expensesByCategory(
  expenses: readonly { category: string; amount: number }[],
) {
  const grouped = new Map<string, { category: string; total: number; count: number }>();
  for (const e of expenses) {
    const key = e.category.trim() || "Other";
    const cur = grouped.get(key) ?? { category: key, total: 0, count: 0 };
    cur.total += e.amount;
    cur.count += 1;
    grouped.set(key, cur);
  }
  return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
}

export function accountStatement(input: {
  sales: readonly { status: string; total: number }[];
  expenses: readonly { amount: number }[];
  purchases: readonly { paid: number }[];
}) {
  let grossSales = 0;
  let voidedTotal = 0;
  for (const s of input.sales) {
    if (s.status === "completed") grossSales += s.total;
    else if (s.status === "voided") voidedTotal += s.total;
  }
  const totalExpenses = input.expenses.reduce((sum, e) => sum + e.amount, 0);
  const purchasesPaid = input.purchases.reduce((sum, p) => sum + p.paid, 0);
  const netCashFlow = grossSales - totalExpenses - purchasesPaid;

  return { grossSales, voidedTotal, totalExpenses, purchasesPaid, netCashFlow };
}

function csvCell(value: string | number): string {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly (string | number)[])[],
): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\n");
}
