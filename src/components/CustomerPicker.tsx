"use client";

import { useEffect, useState } from "react";
import { db, type Customer } from "../lib/db";
import { getSession } from "../lib/session";
import { ugx } from "../lib/money";
import { generateId } from "../lib/uuid";

interface CustomerPickerProps {
  onSelect: (customer: Customer) => void;
  onCancel: () => void;
}

export function CustomerPicker({ onSelect, onCancel }: CustomerPickerProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = getSession();
      if (!session) return;
      const items = await db.customers
        .where("shop_id")
        .equals(session.shopId)
        .toArray();
      setCustomers(items.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search)
      )
    : customers;

  const handleCreate = async () => {
    const session = getSession();
    if (!session || !newName.trim()) return;
    const id = generateId();
    await db.customers.add({
      id,
      shop_id: session.shopId,
      name: newName.trim(),
      phone: newPhone.trim(),
      notes: "",
      balance: 0,
      server_updated_at: new Date().toISOString(),
    });
    const created = await db.customers.get(id);
    if (created) onSelect(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-kan-navy/60 backdrop-blur-[1px]">
      <div className="flex max-h-[85vh] w-full max-w-[420px] flex-col rounded-t-2xl bg-kan-white p-4 pb-8 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-kan-navy">Select customer</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-kan-navy/65"
          >
            Cancel
          </button>
        </div>

        <input
          type="text"
          placeholder="Search name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
        />

        <div className="flex-1 space-y-1.5 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-kan-navy/60">
              Loading...
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-kan-navy/60">
              {search ? "No match" : "No customers yet"}
            </p>
          ) : (
            filtered.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => onSelect(c)}
                className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-3.5 py-2.5 text-left active:bg-kan-teal/15"
              >
                <div>
                  <p className="text-sm font-semibold text-kan-navy">
                    {c.name}
                  </p>
                  {c.phone && (
                    <p className="text-xs text-kan-navy/60">{c.phone}</p>
                  )}
                </div>
                {c.balance > 0 && (
                  <span className="ugx-amount rounded-full bg-kan-guava/25 px-2.5 py-0.5 text-xs font-bold text-kan-navy">
                    Deni: {ugx(c.balance)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {!showNew ? (
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="mt-3 min-h-[44px] w-full rounded-xl border border-kan-navy/25 bg-white py-2.5 text-sm font-bold text-kan-navy active:bg-kan-navy/5"
          >
            + New customer
          </button>
        ) : (
          <div className="mt-3 space-y-2 border-t border-kan-navy/10 pt-3">
            <input
              type="text"
              placeholder="Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-xl border border-kan-navy/20 bg-white px-3 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
            />
            <input
              type="tel"
              placeholder="Phone (+256..., optional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full rounded-xl border border-kan-navy/20 bg-white px-3 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="min-h-[42px] flex-1 rounded-xl border border-kan-navy/20 bg-white py-2 text-sm font-semibold text-kan-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="min-h-[42px] flex-1 rounded-xl bg-kan-navy py-2 text-sm font-bold text-kan-white disabled:opacity-50"
              >
                Create &amp; select
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
