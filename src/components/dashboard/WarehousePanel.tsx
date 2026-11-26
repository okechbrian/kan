"use client";

import { ownerRows, ownerContext } from "../../lib/dashboard/access";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Warehouse as WarehouseIcon } from "lucide-react";
import { db, type StockTransfer, type Warehouse } from "../../lib/db";
import { generateId } from "../../lib/uuid";
import { DataTable, Input } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function WarehousePanel() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [shopId, setShopId] = useState("default-shop");
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [shops, wRows, tRows] = await Promise.all([
      ownerRows(db.shops),
      ownerRows(db.warehouses),
      ownerRows(db.stock_transfers),
    ]);
    setShopId(shops[0]?.id ?? "default-shop");
    setWarehouses(wRows);
    setTransfers(tRows.sort((a, b) => b.created_at.localeCompare(a.created_at)));
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    await ownerContext(shopId);
    setFeedback("");
    if (!name.trim()) {
      setFeedback("Warehouse name is required.");
      return;
    }
    await db.warehouses.add({
      id: generateId(),
      shop_id: shopId,
      name: name.trim(),
      active: true,
      created_at: new Date().toISOString(),
    });
    setName("");
    setFeedback("Warehouse added.");
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Warehouses</h1>
            <StatusBadge state="now" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            Track storage rooms, batch expiry and inter-branch stock transfers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/stock/batches" className="btn-secondary text-xs">
            Batches & expiry
          </Link>
          <Link href="/stock/transfer" className="btn-primary text-xs">
            Transfer stock
          </Link>
        </div>
      </header>

      <form onSubmit={handleAdd} className="card flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-80">
          <Input
            label="Add storage location / warehouse"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Entebbe Back Store"
          />
        </div>
        <button type="submit" className="btn-primary text-sm">
          Add warehouse
        </button>
        {feedback ? <p className="text-xs font-bold text-navy">{feedback}</p> : null}
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-navy">
            <WarehouseIcon className="h-4 w-4" aria-hidden="true" />
            Locations ({warehouses.length})
          </h2>
          <DataTable
            rows={warehouses}
            rowKey={(w) => w.id}
            emptyMessage="No separate warehouses yet. Add a back store or branch depot above."
            columns={[
              { key: "name", header: "Location", render: (w) => <span className="font-bold">{w.name}</span> },
              {
                key: "status",
                header: "Status",
                render: (w) => (
                  <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[11px] font-bold text-navy">
                    {w.active ? "Active" : "Inactive"}
                  </span>
                ),
              },
            ]}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-navy">
            Recent transfers ({transfers.length})
          </h2>
          <DataTable
            rows={transfers}
            rowKey={(t) => t.id}
            emptyMessage="No inter-branch transfers recorded yet."
            columns={[
              {
                key: "date",
                header: "Date",
                render: (t) => <span className="text-xs">{t.created_at.slice(0, 10)}</span>,
              },
              {
                key: "lines",
                header: "Lines",
                align: "right",
                numeric: true,
                render: (t) => String(t.lines.length),
              },
              {
                key: "status",
                header: "Status",
                render: (t) => <span className="text-xs font-bold uppercase">{t.status}</span>,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
