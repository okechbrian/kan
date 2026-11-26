"use client";

import { ownerRows, ownerContext } from "../../lib/dashboard/access";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { BookmarkCheck } from "lucide-react";
import { db, type ReservedOrderRecord } from "../../lib/db";
import { ugx } from "../../lib/money";
import { validateReservedOrderInput } from "../../lib/dashboard/tools";
import { generateId } from "../../lib/uuid";
import { DataTable, Input } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function ReservedOrdersPanel() {
  const [orders, setOrders] = useState<ReservedOrderRecord[]>([]);
  const [shopId, setShopId] = useState("default-shop");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [deposit, setDeposit] = useState("0");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [shops, rows] = await Promise.all([
      ownerRows(db.shops),
      ownerRows(db.reserved_orders),
    ]);
    setShopId(shops[0]?.id ?? "default-shop");
    setOrders(rows.sort((a, b) => b.created_at.localeCompare(a.created_at)));
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await ownerContext(shopId);
    setFeedback("");
    const lineQty = Number(qty);
    const priceVal = Number(unitPrice);
    const depositVal = Number(deposit || "0");
    const check = validateReservedOrderInput({
      customerName,
      lines: [{ name: itemName, qty: lineQty, unit_price: priceVal }],
      depositUgx: depositVal,
    });
    if (!check.ok) {
      setFeedback(check.error);
      return;
    }

    await db.reserved_orders.add({
      id: generateId(),
      shop_id: shopId,
      customer_id: null,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      lines: [
        {
          name: itemName.trim(),
          qty: lineQty,
          unit_price: priceVal,
          line_total: check.total,
        },
      ],
      total: check.total,
      deposit_ugx: depositVal,
      status: "held",
      created_at: new Date().toISOString(),
    });
    setCustomerName("");
    setCustomerPhone("");
    setItemName("");
    setQty("1");
    setUnitPrice("");
    setDeposit("0");
    setFeedback("Reserved order saved.");
    await load();
  }

  async function updateStatus(id: string, status: ReservedOrderRecord["status"]) {
    await ownerContext(shopId);
    await db.reserved_orders.update(id, { status });
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Reserved orders</h1>
            <StatusBadge state="now" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            Track held orders, layaway deposits and pay-later invoices.
          </p>
        </div>
        <Link href="/app/orders" className="btn-secondary text-xs">
          ← Back to orders
        </Link>
      </header>

      <form onSubmit={handleCreate} className="card space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
          Create reserved / pay-later order
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Customer name"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Kato Robert"
          />
          <Input
            label="Customer phone (+256)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="0791149592"
          />
          <Input
            label="Item description"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Office Desk"
          />
          <Input
            label="Quantity"
            type="number"
            min={1}
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <Input
            label="Unit price (UGX)"
            type="number"
            min={1}
            required
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="250000"
          />
          <Input
            label="Deposit paid (UGX)"
            type="number"
            min={0}
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary text-sm">
            Save reserved order
          </button>
          {feedback ? <p className="text-xs font-bold text-navy">{feedback}</p> : null}
        </div>
      </form>

      <DataTable
        rows={orders}
        rowKey={(r) => r.id}
        emptyMessage="No reserved or held orders yet."
        columns={[
          {
            key: "customer",
            header: "Customer",
            render: (r) => (
              <div>
                <p className="font-bold text-navy">{r.customer_name}</p>
                <p className="text-xs text-navy/60">
                  {r.lines.map((l) => `${l.name} × ${l.qty}`).join(", ")}
                </p>
              </div>
            ),
          },
          {
            key: "total",
            header: "Total",
            align: "right",
            numeric: true,
            render: (r) => ugx(r.total),
          },
          {
            key: "balance",
            header: "Balance due",
            align: "right",
            numeric: true,
            render: (r) => ugx(r.total - r.deposit_ugx),
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[11px] font-bold uppercase text-navy">
                  {r.status}
                </span>
                {r.status === "held" ? (
                  <button
                    type="button"
                    onClick={() => void updateStatus(r.id, "invoiced")}
                    className="rounded-lg border border-navy/15 px-2 py-1 text-[11px] font-bold text-navy hover:bg-teal-soft"
                  >
                    Mark invoiced
                  </button>
                ) : null}
                {r.status === "invoiced" ? (
                  <button
                    type="button"
                    onClick={() => void updateStatus(r.id, "completed")}
                    className="rounded-lg border border-navy/15 px-2 py-1 text-[11px] font-bold text-navy hover:bg-teal-soft"
                  >
                    Complete
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
