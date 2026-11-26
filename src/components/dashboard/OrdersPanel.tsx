"use client";

import { ownerRows, ownerContext } from "../../lib/dashboard/access";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { db, type Sale, type Tender } from "../../lib/db";
import { ugx } from "../../lib/money";
import { voidSale } from "../../lib/sale";
import { DataTable, Modal } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

type EnrichedSale = Sale & { methods: string; customerName: string };

export function OrdersPanel() {
  const [rows, setRows] = useState<EnrichedSale[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "credit" | "voided">("all");
  const [voidTarget, setVoidTarget] = useState<EnrichedSale | null>(null);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [sales, tenders, customers] = await Promise.all([
      ownerRows(db.sales),
      ownerRows(db.tenders),
      ownerRows(db.customers),
    ]);
    const custMap = new Map(customers.map((c) => [c.id, c.name]));
    const tenderBySale = new Map<string, Tender[]>();
    for (const t of tenders) {
      const list = tenderBySale.get(t.sale_id) ?? [];
      list.push(t);
      tenderBySale.set(t.sale_id, list);
    }

    const enriched = sales
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((s) => ({
        ...s,
        methods:
          (tenderBySale.get(s.id) ?? []).map((t) => t.method).join(", ") || "cash",
        customerName: s.customer_id ? custMap.get(s.customer_id) ?? "Customer" : "Walk-in",
      }));
    setRows(enriched);
  }

  useEffect(() => {
    void load();
  }, []);

  async function confirmVoid() {
    if (!voidTarget) return;
    setFeedback("");
    try {
      const owner = await ownerContext();
      await voidSale({
        saleId: voidTarget.id,
        reason: reason.trim() || "Customer refund",
        userId: owner.userId,
      });
      setVoidTarget(null);
      setReason("");
      setFeedback("Sale voided and stock/deni reversed.");
      await load();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Could not void sale.");
    }
  }

  const filtered = rows.filter((r) => {
    if (filter === "completed") return r.status === "completed";
    if (filter === "voided") return r.status === "voided";
    if (filter === "credit") return r.methods.includes("credit");
    return true;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">
              Transactions & orders
            </h1>
            <StatusBadge state="now" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            Counter sales, credit (deni) records and owner-only refunds/voids.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/reserved-orders" className="btn-secondary text-xs">
            Reserved orders
          </Link>
          <Link href="/pos" className="btn-primary text-xs">
            New sale
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["completed", "Completed"],
            ["credit", "Credit (deni)"],
            ["voided", "Voided / refunded"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`min-h-10 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              filter === id
                ? "bg-navy text-softwhite"
                : "border border-navy/15 bg-white text-navy hover:bg-teal-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {feedback ? (
        <p className="rounded-xl bg-teal-soft p-3 text-xs font-bold text-navy">{feedback}</p>
      ) : null}

      <DataTable
        rows={filtered}
        rowKey={(row) => row.id}
        emptyMessage="No transactions recorded yet. Complete a sale at the counter till."
        columns={[
          {
            key: "date",
            header: "Date",
            render: (row) => (
              <span className="text-xs text-navy/75">
                {row.created_at.slice(0, 16).replace("T", " ")}
              </span>
            ),
          },
          {
            key: "customer",
            header: "Customer",
            render: (row) => <span className="font-semibold">{row.customerName}</span>,
          },
          {
            key: "methods",
            header: "Payment",
            render: (row) => <span className="text-xs uppercase">{row.methods}</span>,
          },
          {
            key: "total",
            header: "Total",
            align: "right",
            numeric: true,
            render: (row) => ugx(row.total),
          },
          {
            key: "status",
            header: "Status",
            render: (row) =>
              row.status === "completed" ? (
                <button
                  type="button"
                  onClick={() => setVoidTarget(row)}
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-navy/15 px-2.5 py-1 text-xs font-bold text-navy hover:bg-guava-soft"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Void / refund
                </button>
              ) : (
                <span className="rounded-full bg-guava-soft px-2.5 py-1 text-[11px] font-bold uppercase text-navy">
                  Voided
                </span>
              ),
          },
        ]}
      />

      <Modal
        open={Boolean(voidTarget)}
        onClose={() => setVoidTarget(null)}
        title="Void & reverse sale"
      >
        <div className="space-y-4">
          <p className="text-sm text-navy/75">
            Voiding reverses stock quantities and customer deni balances for{" "}
            <span className="ugx-amount font-bold text-navy">
              {voidTarget ? ugx(voidTarget.total) : ""}
            </span>
            . Owner permission required.
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (e.g. Wrong item or customer return)"
            className="min-h-11 w-full rounded-xl border border-navy/20 px-3 py-2 text-sm text-navy"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setVoidTarget(null)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="button" onClick={confirmVoid} className="btn-guava text-xs">
              Confirm void
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
