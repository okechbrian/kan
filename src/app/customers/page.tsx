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
    <main className="min-h-screen bg-gray-50 pb-20 mx-auto max-w-[420px]">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Deni</h1>
          <button
            onClick={() => setAdding((v) => !v)}
            className="text-sm font-medium text-blue-700"
          >
            {adding ? "Cancel" : "Add"}
          </button>
        </div>
      </header>

      <div className="p-4">
        {adding && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 space-y-2">
            <input
              type="text"
              placeholder="Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              onClick={() => void handleAdd()}
              disabled={!newName.trim()}
              className="w-full rounded-lg bg-blue-600 py-2 text-white text-sm font-medium disabled:opacity-50"
            >
              Save customer
            </button>
          </div>
        )}

        <label className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Show all
        </label>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Nobody owes the shop right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/customers/${c.id}`)}
                className="w-full flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 text-left active:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.phone && (
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  )}
                </div>
                <span
                  className={`font-bold ${
                    c.balance > 0 ? "text-orange-600" : "text-gray-400"
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
