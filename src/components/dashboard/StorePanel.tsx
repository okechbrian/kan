"use client";

import { ownerRows, ownerContext } from "../../lib/dashboard/access";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, Globe } from "lucide-react";
import { db, type StoreOrderRecord } from "../../lib/db";
import { slugifyShop } from "../../lib/store/catalogue";
import { ugx } from "../../lib/money";
import { DataTable, StatCard } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function StorePanel() {
  const [slug, setSlug] = useState("demo-duuka");
  const [publishedCount, setPublishedCount] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [orders, setOrders] = useState<StoreOrderRecord[]>([]);
  const [copied, setCopied] = useState(false);

  async function load() {
    const [shops, products, orderRows] = await Promise.all([
      ownerRows(db.shops),
      ownerRows(db.products),
      ownerRows(db.store_orders),
    ]);
    if (shops[0]?.name) {
      setSlug(slugifyShop(shops[0].name));
    }
    const pub = products.filter((p) => p.active && (p.published_online ?? true)).length;
    setPublishedCount(pub);
    setHiddenCount(products.length - pub);
    setOrders(orderRows.sort((a, b) => b.created_at.localeCompare(a.created_at)));
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateOrderStatus(id: string, status: StoreOrderRecord["status"]) {
    await ownerContext();
    await db.store_orders.update(id, { status });
    await load();
  }

  function copyLink() {
    const url = `${window.location.origin}/shop/${slug}`;
    void navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Online store</h1>
            <StatusBadge state="soon" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            Local storefront preview only. Customers cannot place orders from a shared link yet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copyLink} className="btn-secondary gap-1.5 text-xs">
            <Copy className="h-4 w-4" aria-hidden="true" />
            {copied ? "Copied link" : "Copy preview link"}
          </button>
          <Link href={`/shop/${slug}`} className="btn-primary gap-1.5 text-xs">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Open storefront
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Published items"
          value={String(publishedCount)}
          icon={<Globe className="h-4 w-4" />}
        />
        <StatCard label="Hidden items" value={String(hiddenCount)} />
        <StatCard label="Online orders" value={String(orders.length)} />
      </div>

      <DataTable
        rows={orders}
        rowKey={(o) => o.id}
        emptyMessage="No online orders in the inbox yet. Live online ordering is coming soon."
        columns={[
          {
            key: "customer",
            header: "Buyer",
            render: (o) => (
              <div>
                <p className="font-bold text-navy">{o.customer_name}</p>
                <p className="text-xs text-navy/60">
                  {o.customer_phone} · {o.delivery_band}
                </p>
              </div>
            ),
          },
          {
            key: "total",
            header: "Total",
            align: "right",
            numeric: true,
            render: (o) => ugx(o.total),
          },
          {
            key: "status",
            header: "Status",
            render: (o) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[11px] font-bold uppercase text-navy">
                  {o.status}
                </span>
                {o.status === "pending" ? (
                  <button
                    type="button"
                    onClick={() => void updateOrderStatus(o.id, "confirmed")}
                    className="rounded-lg border border-navy/15 px-2 py-1 text-[11px] font-bold text-navy hover:bg-teal-soft"
                  >
                    Confirm
                  </button>
                ) : null}
                {o.status === "confirmed" ? (
                  <button
                    type="button"
                    onClick={() => void updateOrderStatus(o.id, "dispatched")}
                    className="rounded-lg border border-navy/15 px-2 py-1 text-[11px] font-bold text-navy hover:bg-teal-soft"
                  >
                    Dispatch
                  </button>
                ) : null}
                {o.status === "dispatched" ? (
                  <button
                    type="button"
                    onClick={() => void updateOrderStatus(o.id, "delivered")}
                    className="rounded-lg border border-navy/15 px-2 py-1 text-[11px] font-bold text-navy hover:bg-teal-soft"
                  >
                    Delivered
                  </button>
                ) : null}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
