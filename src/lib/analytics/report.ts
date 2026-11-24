import { averageBasket, methodTotals, productPerformance, type SaleLike } from "./sales";
import type { StockAlert, ExpiryAlert } from "./alerts";

const ugx = (amount: number) => {
  if (!Number.isInteger(amount)) throw new Error("UGX amounts must be integers");
  return `UGX ${Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

export type ReportFrequency = "daily" | "weekly" | "monthly";

export function validateFrequency(input: string): ReportFrequency {
  if (input !== "daily" && input !== "weekly" && input !== "monthly") {
    throw new Error("invalid_frequency");
  }
  return input;
}

export function dailyReport(input: {
  date: string;
  sales: SaleLike[];
  stock: StockAlert[];
  expiry: ExpiryAlert[];
  expenses: number;
}) {
  const completed = input.sales.filter((sale) => sale.status === "completed");
  const total = completed.reduce((sum, sale) => sum + sale.total, 0);
  const methods = methodTotals(completed);
  const top = productPerformance(completed).slice(0, 3);
  const profit = productPerformance(completed).reduce((sum, row) => sum + row.profit, 0) - input.expenses;
  return [
    `Kan daily report - ${input.date}`,
    "-".repeat(28),
    `Sales: ${completed.length}`,
    `Total: ${ugx(total)}`,
    `Average basket: ${ugx(averageBasket(completed))}`,
    ...methods.map((row) => `${row.method}: ${ugx(row.amount)}`),
    `Profit estimate: ${ugx(profit)}`,
    `Low/out of stock: ${input.stock.length}`,
    `Expiry alerts: ${input.expiry.length}`,
    ...top.map((row) => `${row.name}: ${ugx(row.revenue)}`),
  ].join("\n");
}
