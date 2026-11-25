"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Receipt } from "lucide-react";
import { db, type ExpenseRecord } from "../../lib/db";
import { ugx } from "../../lib/money";
import { validateExpenseInput } from "../../lib/dashboard/tools";
import { generateId } from "../../lib/uuid";
import { DataTable, Input, StatCard } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

const CATEGORIES = ["Rent", "Transport", "Utilities", "Fuel", "Restocking", "Salaries", "Other"];

export function ExpensesPanel() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [shopId, setShopId] = useState("default-shop");
  const [category, setCategory] = useState("Transport");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [shops, rows] = await Promise.all([db.shops.toArray(), db.expenses.toArray()]);
    setShopId(shops[0]?.id ?? "default-shop");
    setExpenses(rows.sort((a, b) => b.incurred_at.localeCompare(a.incurred_at)));
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setFeedback("");
    const parsed = validateExpenseInput({
      category,
      amount: Number(amount),
      description,
    });
    if (!parsed.ok) {
      setFeedback(parsed.error);
      return;
    }

    await db.expenses.add({
      id: generateId(),
      shop_id: shopId,
      category: parsed.value.category,
      amount: parsed.value.amount,
      description: parsed.value.description,
      user_id: "dashboard",
      incurred_at: new Date().toISOString(),
    });
    setAmount("");
    setDescription("");
    setFeedback("Expense recorded.");
    await load();
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Expenses</h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-1 text-sm text-navy/65">
          Track rent, transport, utilities, fuel and daily running costs in integer UGX.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Recorded expenses" value={String(expenses.length)} />
        <StatCard label="Total expenses" value={ugx(totalSpent)} deltaTone="guava" />
      </div>

      <form onSubmit={handleAdd} className="card space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <Receipt className="h-4 w-4" aria-hidden="true" />
          Log an expense
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm font-bold text-navy">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-navy/20 bg-white px-3 py-2 text-sm text-navy"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Amount (UGX)"
            type="number"
            min={1}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="15000"
          />
          <Input
            label="Note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Boda delivery from Kisenyi"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary text-sm">
            Save expense
          </button>
          {feedback ? <p className="text-xs font-bold text-navy">{feedback}</p> : null}
        </div>
      </form>

      <DataTable
        rows={expenses}
        rowKey={(e) => e.id}
        emptyMessage="No expenses logged yet."
        columns={[
          {
            key: "date",
            header: "Date",
            render: (e) => (
              <span className="text-xs text-navy/70">{e.incurred_at.slice(0, 10)}</span>
            ),
          },
          { key: "category", header: "Category", render: (e) => <span className="font-bold">{e.category}</span> },
          { key: "note", header: "Description", render: (e) => e.description || "—" },
          { key: "amount", header: "Amount", align: "right", numeric: true, render: (e) => ugx(e.amount) },
        ]}
      />
    </div>
  );
}
