"use client";

import { useEffect, useState } from "react";
import { db } from "../../lib/db";
import { ugx } from "../../lib/money";
import { reconcileByMethod, type MethodTotal } from "../../lib/payments/reconcile";
import type { PaymentMethod } from "../../lib/payments/adapters";
import { StatusBadge } from "../site/StatusBadge";

const METHODS: { method: PaymentMethod; label: string; state: "now" | "soon" }[] = [
  { method: "cash", label: "Cash", state: "now" },
  { method: "mtn_momo", label: "MTN MoMo", state: "now" },
  { method: "airtel_money", label: "Airtel Money", state: "now" },
  { method: "credit", label: "Credit (deni)", state: "now" },
  { method: "bank_transfer", label: "Bank transfer", state: "soon" },
  { method: "card", label: "Card", state: "soon" },
  { method: "gift_card", label: "Gift card", state: "soon" },
  { method: "crypto", label: "Crypto", state: "soon" },
];

export function PaymentsPanel() {
  const [recorded, setRecorded] = useState<MethodTotal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const tenders = await db.tenders.toArray();
      const totals = new Map<PaymentMethod, number>();
      for (const tender of tenders) {
        totals.set(
          tender.method as PaymentMethod,
          (totals.get(tender.method as PaymentMethod) ?? 0) + tender.amount
        );
      }
      setRecorded(
        Array.from(totals.entries()).map(([method, amount]) => ({ method, amount }))
      );
      setLoading(false);
    }
    void load();
  }, []);

  const rows = reconcileByMethod([], recorded);

  return (
    <div className="space-y-5">
      <section className="card">
        <h2 className="text-base font-bold">Available payment methods</h2>
        <p className="mt-2 text-xs text-ink/50">
          Manual confirmation only. No gateway credentials, card data or bank
          connection is needed.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {METHODS.map((item) => (
            <div
              key={item.method}
              className="flex min-h-11 items-center justify-between rounded-lg border border-black/10 px-3 py-2"
            >
              <span className="text-sm font-medium">{item.label}</span>
              <StatusBadge state={item.state} />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-base font-bold">Recorded by method</h2>
        {loading ? (
          <p className="mt-4 text-sm text-ink/50">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-black/15 p-4 text-sm text-ink/50">
            No payments recorded yet. Complete a sale to see totals here.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {rows.map((row) => (
              <li key={row.method} className="flex justify-between text-sm">
                <span className="capitalize">{row.method.replace(/_/g, " ")}</span>
                <span className="font-semibold">{ugx(row.recorded)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
