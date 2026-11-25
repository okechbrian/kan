"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, CreditCard, DollarSign, ShoppingBag, Store } from "lucide-react";
import { db } from "../../lib/db";
import { ugx } from "../../lib/money";
import { summarizeDashboard } from "../../lib/dashboard/tools";
import { stockAlerts } from "../../lib/analytics/alerts";
import { StatCard } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function LiveDashboardPanel() {
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState("Your shop");
  const [summary, setSummary] = useState<ReturnType<typeof summarizeDashboard> | null>(null);
  const [lowItems, setLowItems] = useState<{ productId: string; name: string; quantity: number }[]>([]);

  useEffect(() => {
    async function load() {
      const [shops, sales, lines, tenders, expenses, products, batches, customers] =
        await Promise.all([
          db.shops.toArray(),
          db.sales.toArray(),
          db.sale_lines.toArray(),
          db.tenders.toArray(),
          db.expenses.toArray(),
          db.products.toArray(),
          db.batches.toArray(),
          db.customers.toArray(),
        ]);

      if (shops[0]?.name) setShopName(shops[0].name);
      const productMap = new Map(products.map((p) => [p.id, p]));
      const saleLikes = sales.map((s) => ({
        id: s.id,
        created_at: s.created_at,
        status: s.status,
        total: s.total,
        tenders: tenders
          .filter((t) => t.sale_id === s.id)
          .map((t) => ({ method: t.method, amount: t.amount })),
        lines: lines
          .filter((l) => l.sale_id === s.id)
          .map((l) => ({
            productId: l.product_id,
            name: productMap.get(l.product_id)?.name ?? "Item",
            qty: l.qty,
            unitPrice: l.unit_price,
            buyingPriceSnapshot: l.buying_price_snapshot,
            lineTotal: l.line_total,
          })),
      }));

      const nextSummary = summarizeDashboard({
        sales: saleLikes,
        expenses,
        products,
        batches: batches.map((b) => ({
          id: b.id,
          productId: b.product_id,
          quantity: b.quantity,
          expiryDate: b.expiry_date,
        })),
        customers,
      });
      setSummary(nextSummary);
      setLowItems(stockAlerts(products).slice(0, 5));
      setLoading(false);
    }
    void load();
  }, []);

  const maxDayTotal = Math.max(1, ...(summary?.dailySeries.map((d) => d.total) ?? [1]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Dashboard</h1>
            <StatusBadge state="now" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            Live local shop overview for <span className="font-bold text-navy">{shopName}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pos" className="btn-primary text-sm">
            Open counter till
          </Link>
          <Link href="/app/products" className="btn-secondary text-sm">
            Manage products
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={loading || !summary ? "UGX 0" : ugx(summary.totalRevenue)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label="Completed sales"
          value={loading || !summary ? "0" : String(summary.orderCount)}
          delta={summary ? `Avg ${ugx(summary.averageBasket)}` : undefined}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <StatCard
          label="Expenses"
          value={loading || !summary ? "UGX 0" : ugx(summary.totalExpenses)}
          delta={summary ? `Net est. ${ugx(summary.netEstimate)}` : undefined}
          deltaTone={summary && summary.netEstimate >= 0 ? "teal" : "guava"}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="Customer deni"
          value={loading || !summary ? "UGX 0" : ugx(summary.totalDeni)}
          delta={summary ? `${summary.lowStockCount} low stock` : undefined}
          deltaTone={summary && summary.lowStockCount > 0 ? "guava" : "teal"}
          icon={<CreditCard className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="card lg:col-span-7">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-navy">Daily sales (last 7 active days)</h2>
            <Link href="/app/reports" className="text-xs font-bold text-navy underline">
              Full reports →
            </Link>
          </div>
          {!summary || summary.dailySeries.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-navy/15 bg-softwhite p-6 text-center">
              <p className="text-sm font-semibold text-navy/70">
                No completed sales yet. Open the till to record your first sale.
              </p>
              <Link href="/pos" className="btn-secondary mt-3 text-xs">
                Open till
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-7 items-end gap-2">
              {summary.dailySeries.map((day) => {
                const heightPct = Math.max(12, Math.round((day.total / maxDayTotal) * 100));
                return (
                  <div key={day.day} className="flex flex-col items-center gap-1.5" title={ugx(day.total)}>
                    <span className="ugx-amount text-[10px] font-bold text-navy/70">
                      {day.count}
                    </span>
                    <div className="flex h-28 w-full items-end rounded-lg bg-softwhite p-1">
                      <div
                        className="w-full rounded-md bg-navy"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-navy/65">
                      {day.day.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy">
              <AlertTriangle className="h-4 w-4 text-guava-dark" aria-hidden="true" />
              Stock alerts
            </h2>
            <Link href="/app/alerts" className="text-xs font-bold text-navy underline">
              All alerts →
            </Link>
          </div>
          {lowItems.length === 0 ? (
            <p className="rounded-xl bg-teal-soft p-3 text-xs font-semibold text-navy">
              No low-stock items right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {lowItems.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between rounded-xl border border-navy/10 bg-softwhite px-3 py-2 text-xs"
                >
                  <span className="font-bold text-navy">{item.name}</span>
                  <span className="ugx-amount rounded-full bg-guava-soft px-2 py-0.5 font-bold text-navy">
                    {item.quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-navy/10 pt-3">
            <div className="flex items-center justify-between text-xs font-bold text-navy">
              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4" aria-hidden="true" />
                Quick tools
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/app/expenses" className="btn-secondary py-2 text-xs">
                Log expense
              </Link>
              <Link href="/app/purchases" className="btn-secondary py-2 text-xs">
                Record purchase
              </Link>
              <Link href="/app/reserved-orders" className="btn-secondary py-2 text-xs">
                Reserved orders
              </Link>
              <Link href="/app/warehouse" className="btn-secondary py-2 text-xs">
                Warehouses
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
