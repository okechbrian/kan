"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, type Customer } from "../../lib/db";
import { getSession } from "../../lib/session";
import { ugx } from "../../lib/money";
import { generateId } from "../../lib/uuid";
import { BottomNav } from "../../components/BottomNav";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

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
      const items = await db.customers
        .where("shop_id")
        .equals(session.shopId)
        .toArray();
      setCustomers(items.sort((a, b) => b.balance - a.balance));
      setLoading(false);
    }
    load();
  }, [router]);

  const visible = showAll
    ? customers
    : customers.filter((c) => c.balance > 0);

  const handleAdd = async () => {
    const session = getSession();
    if (!session || !newName.trim()) return;
    const id = generateId();
    const row: Customer = {
      id,
      shop_id: session.shopId,
      name: newName.trim(),
      phone: newPhone.trim(),
      notes: "",
      balance: 0,
      server_updated_at: new Date().toISOString(),
    };
    await db.customers.add(row);
    setCustomers((prev) => [...prev, row]);
    setNewName("");
    setNewPhone("");
    setAdding(false);
    router.push(`/customers/${id}`);
  };

  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-20">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Deni</h1>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="rounded-lg bg-kan-teal px-3 py-1.5 text-xs font-bold text-kan-navy"
          >
            {adding ? "Cancel" : "+ Add"}
          </button>
        </div>
      </header>

      <div className="p-4">
        {adding && (
          <div className="mb-4 space-y-2 rounded-xl border border-kan-navy/15 bg-white p-3.5 shadow-sm">
            <input
              type="text"
              placeholder="Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-xl border border-kan-navy/20 px-3 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
            />
            <input
              type="tel"
              placeholder="Phone (+256..., optional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full rounded-xl border border-kan-navy/20 px-3 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={!newName.trim()}
              className="min-h-[44px] w-full rounded-xl bg-kan-navy py-2.5 text-sm font-bold text-kan-white disabled:opacity-50"
            >
              Save customer
            </button>
          </div>
        )}

        <label className="mb-3 flex items-center gap-2 text-sm font-medium text-kan-navy/75">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-4 w-4 accent-kan-navy"
          />
          Show all customers
        </label>

        {loading ? (
          <p className="py-12 text-center text-sm text-kan-navy/60">
            Loading...
          </p>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-kan-navy/10 bg-white px-4 py-12 text-center text-sm text-kan-navy/65">
            <p className="font-semibold text-kan-navy">
              Nobody owes the shop right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => router.push(`/customers/${c.id}`)}
                className="flex min-h-[56px] w-full items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-4 py-3 text-left shadow-sm active:bg-kan-teal/10"
              >
                <div>
                  <p className="font-bold text-kan-navy">{c.name}</p>
                  {c.phone && (
                    <p className="text-xs text-kan-navy/60">{c.phone}</p>
                  )}
                </div>
                <span
                  className={`ugx-amount rounded-full px-2.5 py-1 text-xs font-bold ${
                    c.balance > 0
                      ? "bg-kan-guava/25 text-kan-navy"
                      : "bg-kan-navy/5 text-kan-navy/50"
                  }`}
                >
                  {ugx(c.balance)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
