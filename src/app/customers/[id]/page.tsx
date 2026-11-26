"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  db,
  type Customer,
  type DeniLedger,
  type Shift,
} from "../../../lib/db";
import { getSession } from "../../../lib/session";
import { ugx } from "../../../lib/money";
import { recordDeniCollection } from "../../../lib/sale";
import { BottomNav } from "../../../components/BottomNav";

const TYPE_LABEL: Record<DeniLedger["type"], string> = {
  sale_credit: "Sale on deni",
  collection: "Collection",
  void: "Void",
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledger, setLedger] = useState<DeniLedger[]>([]);
  const [shift, setShift] = useState<Shift | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<"cash" | "mtn_momo" | "airtel_money">(
    "cash"
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const session = getSession();
      if (!session) {
        router.replace("/pin");
        return;
      }
      const openShift = await db.shifts
        .where("[shop_id+status]")
        .equals([session.shopId, "open"])
        .first();
      if (!openShift) {
        router.replace("/shift/open");
        return;
      }
      setShift(openShift);
      const row = await db.customers.get(params.id);
      if (!row || row.shop_id !== session.shopId) {
        router.replace("/customers");
        return;
      }
      setCustomer(row);
      setAmount(row.balance);
      const entries = await db.deni_ledger
        .where("customer_id")
        .equals(row.id)
        .toArray();
      entries.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setLedger(entries);
    }
    load();
  }, [params.id, router]);

  const handleCollect = async () => {
    const session = getSession();
    if (!session || !shift || !customer || saving) return;
    if (!Number.isInteger(amount) || amount <= 0) return;
    if (amount > customer.balance) {
      setToast("Amount is more than they owe");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    setSaving(true);
    try {
      await recordDeniCollection({
        shopId: session.shopId,
        shiftId: shift.id,
        userId: session.userId,
        customerId: customer.id,
        amount,
        method,
      });
      const updated = await db.customers.get(customer.id);
      setCustomer(updated ?? null);
      const entries = await db.deni_ledger
        .where("customer_id")
        .equals(customer.id)
        .toArray();
      entries.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      setLedger(entries);
      setCollecting(false);
      setAmount(updated?.balance ?? 0);
      setToast("Collected");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-kan-white">
        <p className="text-sm text-kan-navy/60">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-20">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm">
        <button
          type="button"
          onClick={() => router.push("/customers")}
          className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-kan-teal"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Deni
        </button>
        <h1 className="text-lg font-bold">{customer.name}</h1>
        {customer.phone && (
          <p className="text-xs text-kan-white/75">{customer.phone}</p>
        )}
      </header>

      <div className="space-y-4 p-4">
        <section className="rounded-2xl border border-kan-navy/10 bg-white p-5 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-kan-navy/60">
            Balance owed
          </p>
          <p className="ugx-amount mt-1 text-3xl font-bold text-kan-navy">
            {ugx(customer.balance)}
          </p>
          {customer.balance > 0 && (
            <button
              type="button"
              onClick={() => {
                setAmount(customer.balance);
                setCollecting(true);
              }}
              className="mt-4 min-h-[46px] w-full rounded-xl bg-kan-guava py-2.5 text-sm font-bold text-kan-navy"
            >
              Collect deni
            </button>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-kan-navy/60">
            Ledger
          </h2>
          {ledger.length === 0 ? (
            <p className="text-sm text-kan-navy/60">No entries yet.</p>
          ) : (
            <div className="space-y-1.5">
              {ledger.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-3.5 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-kan-navy">
                      {TYPE_LABEL[e.type]}
                    </p>
                    <p className="text-xs text-kan-navy/50">
                      {e.created_at.slice(0, 16).replace("T", " ")}
                    </p>
                  </div>
                  <span
                    className={`ugx-amount rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      e.amount > 0
                        ? "bg-kan-guava/25 text-kan-navy"
                        : "bg-kan-teal/25 text-kan-navy"
                    }`}
                  >
                    {e.amount > 0 ? `+${ugx(e.amount)}` : `−${ugx(-e.amount)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {collecting && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-kan-navy/60 backdrop-blur-[1px]">
          <div className="w-full max-w-[420px] rounded-t-2xl bg-kan-white p-4 pb-8 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-kan-navy">Collect deni</h2>
              <button
                type="button"
                onClick={() => setCollecting(false)}
                className="text-sm font-semibold text-kan-navy/65"
              >
                Cancel
              </button>
            </div>
            <p className="ugx-amount mb-3 text-center text-sm font-semibold text-kan-navy/70">
              Owes {ugx(customer.balance)}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setAmount(
                  Math.min(parseInt(raw, 10) || 0, customer.balance)
                );
              }}
              className="ugx-amount w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-3 text-center text-lg font-bold text-kan-navy outline-none focus:border-kan-navy"
            />
            <div className="mt-2.5 mb-3 flex flex-wrap gap-2">
              {[customer.balance, 5000, 10000, 20000]
                .filter((chip) => chip > 0 && chip <= customer.balance)
                .map((chip) => (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => setAmount(chip)}
                    className={`ugx-amount rounded-full border px-3 py-1.5 text-xs font-bold ${
                      amount === chip
                        ? "border-kan-navy bg-kan-navy text-kan-white"
                        : "border-kan-navy/20 bg-white text-kan-navy"
                    }`}
                  >
                    {chip === customer.balance ? "All" : ugx(chip)}
                  </button>
                ))}
            </div>
            <div className="mb-4 flex gap-1 rounded-xl bg-kan-navy/10 p-1">
              {(["cash", "mtn_momo", "airtel_money"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold ${
                    method === m
                      ? "bg-kan-navy text-kan-white shadow-sm"
                      : "text-kan-navy/70"
                  }`}
                >
                  {m === "cash"
                    ? "Cash"
                    : m === "mtn_momo"
                      ? "MTN"
                      : "Airtel"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handleCollect()}
              disabled={
                !Number.isInteger(amount) ||
                amount <= 0 ||
                amount > customer.balance ||
                saving
              }
              className="ugx-amount min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white disabled:bg-kan-navy/25"
            >
              {saving
                ? "Recording..."
                : `Collect ${amount > 0 ? ugx(amount) : ""}`}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-kan-navy px-4 py-2 text-sm font-bold text-kan-teal shadow-lg">
          {toast}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
