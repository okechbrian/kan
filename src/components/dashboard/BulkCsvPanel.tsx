"use client";

import { ownerRows, ownerContext } from "../../lib/dashboard/access";

import Link from "next/link";
import { useState } from "react";
import { Upload } from "lucide-react";
import { db } from "../../lib/db";
import { ugx } from "../../lib/money";
import { parseProductsCsv } from "../../lib/dashboard/tools";
import { generateId } from "../../lib/uuid";

const SAMPLE_CSV = `name,unit,buying_price,selling_price,stock_qty,barcode,brand
Sugar 1kg,kg,4200,5000,20,,Kakira
Cooking oil 1L,l,7500,9000,12,,Fresh Fri`;

export function BulkCsvPanel() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const parsed = parseProductsCsv(csvText);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  }

  async function handleImport() {
    const actor = await ownerContext();
    if (parsed.rows.length === 0) {
      setStatus("No valid rows to import.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const shops = await ownerRows(db.shops);
      const shopId = shops[0]?.id ?? "default-shop";
      const now = new Date().toISOString();

      await db.transaction("rw", [db.products, db.stock_movements], async () => {
      for (const row of parsed.rows) {
        const id = generateId();
        await db.products.add({
          id,
          shop_id: shopId,
          name: row.name,
          unit: row.unit,
          sku_code: "",
          buying_price: row.buying_price,
          selling_price: row.selling_price,
          stock_qty: row.stock_qty,
          is_fast_mover: true,
          photo_url: "",
          active: true,
          barcode: row.barcode,
          brand: row.brand,
          published_online: true,
          server_updated_at: now,
        });
        if (row.stock_qty > 0) {
          await db.stock_movements.add({
            id: generateId(),
            shop_id: shopId,
            product_id: id,
            type: "receive",
            qty_delta: row.stock_qty,
            reason: "Bulk CSV import",
            user_id: actor.userId,
            created_at: now,
            ref_id: id,
          });
        }
      }
      });
      setStatus(`Imported ${parsed.rows.length} products into your shop.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy">Bulk CSV product import</h1>
          <p className="mt-1 text-sm text-navy/65">
            Format: <code>name,unit,buying_price,selling_price,stock_qty,barcode,brand</code>
          </p>
        </div>
        <Link href="/app/products" className="btn-secondary text-sm">
          ← Back to products
        </Link>
      </header>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-navy/20 bg-softwhite px-4 py-2 text-xs font-bold text-navy hover:bg-teal-soft">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Choose CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </label>
          <span className="text-xs font-bold text-navy/70">
            {parsed.rows.length} valid · {parsed.errors.length} errors
          </span>
        </div>

        <textarea
          rows={7}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          aria-label="CSV product rows"
          className="w-full rounded-xl border border-navy/20 bg-softwhite p-3 font-mono text-xs text-navy"
        />

        {parsed.errors.length > 0 ? (
          <ul className="space-y-1 rounded-xl bg-guava-soft p-3 text-xs font-semibold text-navy">
            {parsed.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : null}

        {parsed.rows.length > 0 ? (
          <div className="rounded-xl border border-navy/10 bg-softwhite p-3">
            <p className="text-xs font-bold text-navy">Preview ({parsed.rows.length} items)</p>
            <ul className="mt-2 space-y-1 text-xs text-navy/80">
              {parsed.rows.slice(0, 6).map((r, i) => (
                <li key={`${r.name}-${i}`} className="flex justify-between">
                  <span>
                    {r.name} ({r.unit}) · qty {r.stock_qty}
                  </span>
                  <span className="ugx-amount font-bold">{ugx(r.selling_price)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy || parsed.rows.length === 0}
            onClick={handleImport}
            className="btn-primary text-sm"
          >
            {busy ? "Importing..." : `Import ${parsed.rows.length} products`}
          </button>
          {status ? <p className="text-xs font-bold text-navy">{status}</p> : null}
        </div>
      </div>
    </div>
  );
}
