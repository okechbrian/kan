"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "../../lib/db";
import { ugx } from "../../lib/money";
import {
  averageBasket,
  methodTotals,
  productPerformance,
  profitEstimate,
  salesByDay,
  type SaleLike,
} from "../../lib/analytics/sales";
import { StatusBadge } from "../site/StatusBadge";

export function ReportsPanel() {
  const [sales, setSales] = useState<SaleLike[]>([]);
  const [expenses, setExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [rows, movements] = await Promise.all([
        db.sales.toArray(),
        db.cash_movements.toArray(),
      ]);
      const allTenders = await db.tenders.toArray();
      const allLines = await db.sale_lines.toArray();
      setSales(
        rows.map((row) => ({
          id: row.id,
          created_at: row.created_at,
          status: row.status,
          total: row.total,
          tenders: allTenders
            .filter((tender) => tender.sale_id === row.id)
            .map((tender) => ({ method: tender.method, amount: tender.amount })),
          lines: allLines
            .filter((line) => line.sale_id === row.id)
            .map((line) => ({
              productId: line.product_id,
              name: "",
              qty: line.qty,
              unitPrice: line.unit_price,
              buyingPriceSnapshot: line.buying_price_snapshot,
              lineTotal: line.line_total,
            })),
        }))
      );
      setExpenses(
        movements
          .filter((move) => move.type === "expense")
          .reduce((sum, move) => sum + move.amount, 0)
      );
      setLoading(false);
    }
    void load();
  }, []);

  const stats = useMemo(
    () => ({
      total: sales
        .filter((sale) => sale.status === "completed")
        .reduce((sum, sale) => sum + sale.total, 0),
      count: sales.filter((sale) => sale.status === "completed").length,
      basket: averageBasket(sales),
      methods: methodTotals(sales),
      products: productPerformance(sales).slice(0, 5),
      profit: profitEstimate(sales, expenses),
      days: salesByDay(sales).slice(-7),
    }),
    [sales, expenses]
  );

  if (loading) return <p className="py-8 text-sm text-ink/50">Loading reports...</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight">Reports</h1>
        <StatusBadge state="now" />
      </div>
      <p className="text-sm text-ink/60">
        Computed from this device&apos;s till records. Cloud reports open with sync.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Sales total", value: ugx(stats.total) },
          { label: "Completed sales", value: String(stats.count) },
          { label: "Average basket", value: ugx(stats.basket) },
        ].map((card) => (
          <div key={card.label} className="card">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/40">{card.label}</p>
            <p className="mt-2 text-2xl font-black text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-base font-bold">Daily sales</h2>
        {stats.days.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">No closed sales yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.days.map((day) => (
              <li key={day.day} className="flex justify-between text-sm">
                <span>{day.day}</span>
                <span className="font-semibold">
                  {ugx(day.total)} · {day.count} sale{day.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card">
          <h2 className="text-base font-bold">By payment method</h2>
          {stats.methods.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">No payments recorded.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.methods.map((row) => (
                <li key={row.method} className="flex justify-between text-sm">
                  <span className="capitalize">{row.method.replace(/_/g, " ")}</span>
                  <span className="font-semibold">{ugx(row.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="text-base font-bold">Top products</h2>
          {stats.products.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">No product sales yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.products.map((row) => (
                <li key={row.productId} className="flex justify-between text-sm">
                  <span>{row.name || row.productId}</span>
                  <span className="font-semibold">{ugx(row.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/40">
          Profit estimate (last cost) minus recorded expenses
        </p>
        <p className="mt-2 text-3xl font-black text-kan">{ugx(stats.profit)}</p>
        <p className="mt-2 text-xs text-ink/50">
          Estimate only — not net profit. Rent, transport and staff are not included.
        </p>
      </div>
    </div>
  );
}
