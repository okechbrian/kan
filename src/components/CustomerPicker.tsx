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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-md p-4 pb-8 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Select customer</h2>
          <button onClick={onCancel} className="text-gray-500 text-sm">
            Cancel
          </button>
        </div>

        <input
          type="text"
          placeholder="Search name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {loading ? (
            <p className="text-center text-gray-500 py-6">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              {search ? "No match" : "No customers yet"}
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left active:bg-gray-100"
              >
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  {c.phone && (
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  )}
                </div>
                {c.balance > 0 && (
                  <span className="text-xs text-orange-600 font-medium">
                    Deni: {ugx(c.balance)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {!showNew ? (
          <button
            onClick={() => setShowNew(true)}
            className="mt-3 w-full rounded-lg border border-blue-300 py-2.5 text-blue-700 font-medium text-sm active:bg-blue-50"
          >
            + New customer
          </button>
        ) : (
          <div className="mt-3 border-t pt-3 space-y-2">
            <input
              type="text"
              placeholder="Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-700 active:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-white text-sm font-medium active:bg-blue-700 disabled:opacity-50"
              >
                Create & select
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
