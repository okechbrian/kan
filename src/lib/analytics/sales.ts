export type SaleLineLike = {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  buyingPriceSnapshot: number;
  lineTotal: number;
};

export type TenderLike = { method: string; amount: number };

export type SaleLike = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  tenders: TenderLike[];
  lines: SaleLineLike[];
};

export function completedSales(sales: SaleLike[], from?: Date, to?: Date) {
  return sales.filter((sale) => {
    if (sale.status !== "completed") return false;
    if (from && new Date(sale.created_at) < from) return false;
    if (to && new Date(sale.created_at) > to) return false;
    return true;
  });
}

export function salesByDay(sales: SaleLike[]) {
  const days = new Map<string, { total: number; count: number }>();
  for (const sale of completedSales(sales)) {
    const day = sale.created_at.slice(0, 10);
    const entry = days.get(day) ?? { total: 0, count: 0 };
    entry.total += sale.total;
    entry.count += 1;
    days.set(day, entry);
  }
  return Array.from(days.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({ day, ...value }));
}

export function methodTotals(sales: SaleLike[]) {
  const totals = new Map<string, number>();
  for (const sale of completedSales(sales)) {
    for (const tender of sale.tenders) {
      totals.set(tender.method, (totals.get(tender.method) ?? 0) + tender.amount);
    }
  }
  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([method, amount]) => ({ method, amount }));
}

export function averageBasket(sales: SaleLike[]) {
  const completed = completedSales(sales);
  if (completed.length === 0) return 0;
  return Math.round(
    completed.reduce((sum, sale) => sum + sale.total, 0) / completed.length
  );
}

export function productPerformance(sales: SaleLike[]) {
  const rows = new Map<
    string,
    { productId: string; name: string; qty: number; revenue: number; profit: number }
  >();
  for (const sale of completedSales(sales)) {
    for (const line of sale.lines) {
      const row = rows.get(line.productId) ?? {
        productId: line.productId,
        name: line.name,
        qty: 0,
        revenue: 0,
        profit: 0,
      };
      row.qty += line.qty;
      row.revenue += line.lineTotal;
      row.profit += (line.unitPrice - line.buyingPriceSnapshot) * line.qty;
      rows.set(line.productId, row);
    }
  }
  return Array.from(rows.values()).sort((a, b) => b.revenue - a.revenue);
}

export function profitEstimate(sales: SaleLike[], expenses: number) {
  return productPerformance(sales).reduce((sum, row) => sum + row.profit, 0) - expenses;
}
