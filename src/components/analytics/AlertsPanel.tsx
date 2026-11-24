"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { db } from "../../lib/db";
import { ugx } from "../../lib/money";
import { alertCounts, deniAlerts, expiryAlerts, stockAlerts } from "../../lib/analytics/alerts";
import { StatusBadge } from "../site/StatusBadge";

export function AlertsPanel() {
  const [products, setProducts] = useState<{ id: string; name: string; stock_qty: number; reorder_level?: number }[]>([]);
  const [batches, setBatches] = useState<{ id: string; productId: string; quantity: number; expiryDate: string | null }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; balance: number; lastActivity?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allProducts, allBatches, allCustomers, sales] = await Promise.all([
        db.products.toArray(),
        db.batches.toArray(),
        db.customers.toArray(),
        db.sales.toArray(),
      ]);
      setProducts(
        allProducts.map((product) => ({
          id: product.id,
          name: product.name,
          stock_qty: product.stock_qty,
          reorder_level: product.reorder_level,
        }))
      );
      setBatches(
        allBatches.map((batch) => ({
          id: batch.id,
          productId: batch.product_id,
          quantity: batch.quantity,
          expiryDate: batch.expiry_date,
        }))
      );
      const lastByCustomer = new Map<string, string>();
      for (const sale of sales) {
        if (!sale.customer_id) continue;
        const previous = lastByCustomer.get(sale.customer_id);
        if (!previous || sale.created_at > previous) lastByCustomer.set(sale.customer_id, sale.created_at);
      }
      setCustomers(
        allCustomers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          balance: customer.balance,
          lastActivity: lastByCustomer.get(customer.id) ?? null,
        }))
      );
      setLoading(false);
    }
    void load();
  }, []);

  const data = useMemo(
    () => ({
      stock: stockAlerts(products),
      expiry: expiryAlerts(batches),
      deni: deniAlerts(customers),
      counts: alertCounts({ products, batches, customers }),
    }),
    [products, batches, customers]
  );

  if (loading) return <p className="py-8 text-sm text-ink/50">Loading alerts...</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight">Alerts</h1>
        <StatusBadge state="now" />
      </div>
      <p className="text-sm text-ink/60">Things that need attention today.</p>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Low / out of stock", value: data.counts.stock },
          { label: "Expiry", value: data.counts.expiry },
          { label: "Old deni", value: data.counts.deni },
        ].map((card) => (
          <div key={card.label} className="card">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/40">{card.label}</p>
            <p className="mt-2 text-2xl font-black text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="card">
        <h2 className="text-base font-bold">Stock</h2>
        {data.stock.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">Nothing low in stock.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.stock.map((alert) => (
              <li key={alert.productId} className="flex justify-between text-sm">
                <span>{alert.name}</span>
                <span className="font-semibold">
                  {alert.quantity} left · {alert.level}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/stock" className="btn-secondary mt-4 text-sm">
          Open stock
        </Link>
      </section>

      <section className="card">
        <h2 className="text-base font-bold">Expiry</h2>
        {data.expiry.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">No expiring batches.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.expiry.map((alert) => (
              <li key={alert.batchId} className="flex justify-between text-sm">
                <span>{alert.productId}</span>
                <span className="font-semibold">
                  {alert.expiryDate} · {alert.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/stock/batches" className="btn-secondary mt-4 text-sm">
          Open batches
        </Link>
      </section>

      <section className="card">
        <h2 className="text-base font-bold">Customers who owe</h2>
        {data.deni.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50">No old balances to follow up.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.deni.map((alert) => (
              <li key={alert.customerId} className="flex justify-between text-sm">
                <span>{alert.name}</span>
                <span className="font-semibold">
                  {ugx(alert.balance)} · {alert.daysSinceActivity} days
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/customers" className="btn-secondary mt-4 text-sm">
          Open customers
        </Link>
      </section>
    </div>
  );
}
