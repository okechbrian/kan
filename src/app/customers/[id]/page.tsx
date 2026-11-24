"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, type Customer, type DeniLedger, type Shift } from "../../../lib/db";
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
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20 mx-auto max-w-[420px]">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <button
          onClick={() => router.push("/customers")}
          className="text-sm text-blue-700 mb-1"
        >
          ← Deni
        </button>
        <h1 className="text-lg font-bold">{customer.name}</h1>
        {customer.phone && (
          <p className="text-sm text-gray-500">{customer.phone}</p>
        )}
      </header>

      <div className="p-4 space-y-4">
        <section className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-sm text-gray-500">Balance</p>
          <p className="text-3xl font-bold text-orange-600">
            {ugx(customer.balance)}
          </p>
          {customer.balance > 0 && (
            <button
              onClick={() => {
                setAmount(customer.balance);
                setCollecting(true);
              }}
              className="mt-3 w-full rounded-lg bg-orange-600 py-2.5 text-white font-semibold"
            >
              Collect
            </button>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Ledger
          </h2>
          {ledger.length === 0 ? (
            <p className="text-sm text-gray-500">No entries yet.</p>
          ) : (
            <div className="space-y-1">
              {ledger.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{TYPE_LABEL[e.type]}</p>
                    <p className="text-xs text-gray-400">
                      {e.created_at.slice(0, 16).replace("T", " ")}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      e.amount > 0 ? "text-orange-600" : "text-green-700"
                    }`}
                  >
                    {e.amount > 0 ? ugx(e.amount) : ugx(-e.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {collecting && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4 pb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Collect deni</h2>
              <button
                onClick={() => setCollecting(false)}
                className="text-gray-500 text-sm"
              >
                Cancel
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mb-3">
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-center outline-none focus:border-blue-500"
            />
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {[customer.balance, 5000, 10000, 20000]
                .filter((chip) => chip > 0 && chip <= customer.balance)
                .map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setAmount(chip)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                      amount === chip
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {chip === customer.balance ? "All" : ugx(chip)}
                  </button>
                ))}
            </div>
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
              {(["cash", "mtn_momo", "airtel_money"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 rounded-md py-2 text-xs font-medium ${
                    method === m
                      ? "bg-white shadow text-orange-700"
                      : "text-gray-600"
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
              onClick={() => void handleCollect()}
              disabled={
                !Number.isInteger(amount) ||
                amount <= 0 ||
                amount > customer.balance ||
                saving
              }
              className="w-full rounded-lg bg-orange-600 py-3 text-white text-lg font-semibold disabled:opacity-50 disabled:bg-gray-300"
            >
              {saving ? "Recording..." : `Collect ${amount > 0 ? ugx(amount) : ""}`}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
