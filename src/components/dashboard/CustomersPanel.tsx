"use client";

import { ownerRows, ownerContext } from "../../lib/dashboard/access";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { db, type Customer } from "../../lib/db";
import { ugx } from "../../lib/money";
import { generateId } from "../../lib/uuid";
import { DataTable, Input, StatCard } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function CustomersPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopId, setShopId] = useState("default-shop");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [shops, rows] = await Promise.all([ownerRows(db.shops), ownerRows(db.customers)]);
    setShopId(shops[0]?.id ?? "default-shop");
    setCustomers(rows.sort((a, b) => b.balance - a.balance));
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    await ownerContext(shopId);
    setFeedback("");
    if (!name.trim()) {
      setFeedback("Customer name is required.");
      return;
    }
    await db.customers.add({
      id: generateId(),
      shop_id: shopId,
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      balance: 0,
      server_updated_at: new Date().toISOString(),
    });
    setName("");
    setPhone("");
    setNotes("");
    setFeedback("Customer added.");
    await load();
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      c.phone.includes(query.trim()),
  );
  const totalDeni = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Customers & deni</h1>
            <StatusBadge state="now" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            Phone-first customer register, credit balances and deni ledger per shop.
          </p>
        </div>
        <Link href="/customers" className="btn-secondary text-xs">
          Open till customer ledger
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Registered customers" value={String(customers.length)} />
        <StatCard
          label="Total credit owed (deni)"
          value={ugx(totalDeni)}
          deltaTone={totalDeni > 0 ? "guava" : "teal"}
        />
      </div>

      <form onSubmit={handleAdd} className="card space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Add customer
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Full name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grace Nakato"
          />
          <Input
            label="Phone (+256)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0791149592"
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Stage / landmark"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary text-sm">
            Save customer
          </button>
          {feedback ? <p className="text-xs font-bold text-navy">{feedback}</p> : null}
        </div>
      </form>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or phone..."
        aria-label="Search customers"
        className="min-h-11 w-full rounded-xl border border-navy/20 bg-white px-4 py-2 text-sm text-navy sm:w-80"
      />

      <DataTable
        rows={filtered}
        rowKey={(c) => c.id}
        emptyMessage="No customers saved yet. Add a credit customer above or on the till."
        columns={[
          {
            key: "name",
            header: "Customer",
            render: (c) => (
              <div>
                <p className="font-bold text-navy">{c.name}</p>
                <p className="text-xs text-navy/60">{c.phone || "No phone"}</p>
              </div>
            ),
          },
          {
            key: "balance",
            header: "Deni owed",
            align: "right",
            numeric: true,
            render: (c) => ugx(c.balance),
          },
          {
            key: "ledger",
            header: "Ledger",
            render: (c) => (
              <Link
                href={`/customers/${c.id}`}
                className="text-xs font-bold text-navy underline"
              >
                Collect / view →
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
