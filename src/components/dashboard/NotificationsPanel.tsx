"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { db } from "../../lib/db";
import { ugx } from "../../lib/money";
import { deniAlerts, expiryAlerts, stockAlerts } from "../../lib/analytics/alerts";
import { StatusBadge } from "../site/StatusBadge";

type FeedItem = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  href: string;
};

export function NotificationsPanel() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [products, batches, customers, storeOrders, reservedOrders, bookings] =
        await Promise.all([
          db.products.toArray(),
          db.batches.toArray(),
          db.customers.toArray(),
          db.store_orders.toArray(),
          db.reserved_orders.toArray(),
          db.bookings.toArray(),
        ]);

      const feed: FeedItem[] = [];

      for (const s of stockAlerts(products)) {
        feed.push({
          id: `stk-${s.productId}`,
          kind: "Low stock",
          title: `${s.name} (${s.quantity} left)`,
          detail: s.level === "out" ? "Out of stock — restock soon." : "Below reorder level.",
          href: "/app/products",
        });
      }

      for (const e of expiryAlerts(
        batches.map((b) => ({
          id: b.id,
          productId: b.product_id,
          quantity: b.quantity,
          expiryDate: b.expiry_date,
        })),
      )) {
        feed.push({
          id: `exp-${e.batchId}`,
          kind: "Expiry",
          title: `Batch ${e.batchId.slice(0, 6)} · ${e.status}`,
          detail: `${e.quantity} units expiring ${e.expiryDate.slice(0, 10)}.`,
          href: "/stock/batches",
        });
      }

      for (const d of deniAlerts(customers, 0)) {
        feed.push({
          id: `deni-${d.customerId}`,
          kind: "Customer deni",
          title: `${d.name} owes ${ugx(d.balance)}`,
          detail: "Open customer ledger to collect payment.",
          href: `/customers/${d.customerId}`,
        });
      }

      for (const o of storeOrders.filter((r) => r.status === "pending")) {
        feed.push({
          id: `ord-${o.id}`,
          kind: "New store order",
          title: `${o.customer_name} · ${ugx(o.total)}`,
          detail: `Delivery: ${o.delivery_band}`,
          href: "/app/store",
        });
      }

      for (const r of reservedOrders.filter((x) => x.status === "held")) {
        feed.push({
          id: `res-${r.id}`,
          kind: "Reserved order",
          title: `${r.customer_name} · ${ugx(r.total - r.deposit_ugx)} balance`,
          detail: "Held layaway / pay-later order.",
          href: "/app/reserved-orders",
        });
      }

      for (const b of bookings.filter((x) => x.status === "scheduled")) {
        feed.push({
          id: `bk-${b.id}`,
          kind: "Upcoming booking",
          title: `${b.customer_name} — ${b.service_name}`,
          detail: b.scheduled_at.replace("T", " "),
          href: "/app/bookings",
        });
      }

      setItems(feed);
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Notifications</h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-1 text-sm text-navy/65">
          Live operational feed covering low stock, expiry, deni, store orders and
          bookings.
        </p>
      </header>

      {loading ? (
        <div className="card text-sm text-navy/60">Checking shop notifications...</div>
      ) : items.length === 0 ? (
        <div className="card flex items-center gap-3 bg-teal-soft text-sm font-semibold text-navy">
          <Bell className="h-5 w-5 shrink-0" aria-hidden="true" />
          All clear — no pending stock alerts, overdue balances or unconfirmed orders.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="card flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <span className="rounded-full bg-guava-soft px-2.5 py-0.5 text-[10px] font-bold uppercase text-navy">
                  {item.kind}
                </span>
                <h2 className="mt-2 text-base font-bold text-navy">{item.title}</h2>
                <p className="text-xs text-navy/70">{item.detail}</p>
              </div>
              <Link href={item.href} className="btn-secondary text-xs">
                Open →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
