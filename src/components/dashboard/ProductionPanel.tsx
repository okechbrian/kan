"use client";

import { ownerRows, ownerContext } from "../../lib/dashboard/access";

import { useEffect, useState, type FormEvent } from "react";
import { Factory } from "lucide-react";
import { db, type ProductionRunRecord } from "../../lib/db";
import { ugx } from "../../lib/money";
import { generateId } from "../../lib/uuid";
import { DataTable, Input, StatCard } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function ProductionPanel() {
  const [runs, setRuns] = useState<ProductionRunRecord[]>([]);
  const [shopId, setShopId] = useState("default-shop");
  const [productName, setProductName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [qtyProduced, setQtyProduced] = useState("1");
  const [unit, setUnit] = useState("pc");
  const [costUgx, setCostUgx] = useState("0");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [shops, rows] = await Promise.all([
      ownerRows(db.shops),
      ownerRows(db.production_runs),
    ]);
    setShopId(shops[0]?.id ?? "default-shop");
    setRuns(rows.sort((a, b) => b.created_at.localeCompare(a.created_at)));
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    await ownerContext(shopId);
    setFeedback("");
    const qtyVal = Number(qtyProduced);
    const costVal = Number(costUgx || "0");
    if (!productName.trim() || !Number.isInteger(qtyVal) || qtyVal <= 0) {
      setFeedback("Enter a product name and positive integer quantity produced.");
      return;
    }
    if (!Number.isInteger(costVal) || costVal < 0) {
      setFeedback("Batch cost must be a non-negative integer in UGX.");
      return;
    }
    await db.production_runs.add({
      id: generateId(),
      shop_id: shopId,
      product_name: productName.trim(),
      batch_code: batchCode.trim() || `BATCH-${Date.now().toString(36).toUpperCase()}`,
      qty_produced: qtyVal,
      unit: unit.trim() || "pc",
      cost_ugx: costVal,
      notes: notes.trim(),
      created_at: new Date().toISOString(),
    });
    setProductName("");
    setBatchCode("");
    setQtyProduced("1");
    setCostUgx("0");
    setNotes("");
    setFeedback("Production batch logged.");
    await load();
  }

  const totalCost = runs.reduce((sum, r) => sum + r.cost_ugx, 0);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-navy">
            Production & recipes
          </h1>
          <StatusBadge state="now" />
        </div>
        <p className="mt-1 text-sm text-navy/65">
          Record bakery, kitchen and light manufacturing production runs with batch codes
          and input costs.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Logged batches" value={String(runs.length)} />
        <StatCard label="Total input cost" value={ugx(totalCost)} />
      </div>

      <form onSubmit={handleAdd} className="card space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <Factory className="h-4 w-4" aria-hidden="true" />
          Log production batch
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            label="Output product"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Sliced Bread 500g"
          />
          <Input
            label="Batch code"
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value)}
            placeholder="Auto if blank"
          />
          <Input
            label="Qty produced"
            type="number"
            min={1}
            required
            value={qtyProduced}
            onChange={(e) => setQtyProduced(e.target.value)}
          />
          <Input
            label="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="pc / loaf / kg"
          />
          <Input
            label="Batch cost (UGX)"
            type="number"
            min={0}
            value={costUgx}
            onChange={(e) => setCostUgx(e.target.value)}
          />
        </div>
        <Input
          label="Recipe / raw-material notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. 25kg wheat flour + sugar + yeast"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary text-sm">
            Save batch
          </button>
          {feedback ? <p className="text-xs font-bold text-navy">{feedback}</p> : null}
        </div>
      </form>

      <DataTable
        rows={runs}
        rowKey={(r) => r.id}
        emptyMessage="No production runs logged yet."
        columns={[
          { key: "batch", header: "Batch", render: (r) => <span className="font-mono text-xs font-bold">{r.batch_code}</span> },
          {
            key: "product",
            header: "Product",
            render: (r) => (
              <div>
                <p className="font-bold text-navy">{r.product_name}</p>
                <p className="text-xs text-navy/60">{r.notes || "—"}</p>
              </div>
            ),
          },
          { key: "qty", header: "Output", align: "right", numeric: true, render: (r) => `${r.qty_produced} ${r.unit}` },
          { key: "cost", header: "Cost", align: "right", numeric: true, render: (r) => ugx(r.cost_ugx) },
        ]}
      />
    </div>
  );
}
