"use client";

import { ownerRows, ownerContext } from "../../lib/dashboard/access";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Copy, Globe, PackagePlus, Upload } from "lucide-react";
import { db, type Product } from "../../lib/db";
import { ugx } from "../../lib/money";
import { generateId } from "../../lib/uuid";
import { DataTable, Input } from "../ui";
import { StatusBadge } from "../site/StatusBadge";

export function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shopId, setShopId] = useState("");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pc");
  const [buying, setBuying] = useState("");
  const [selling, setSelling] = useState("");
  const [qty, setQty] = useState("0");
  const [barcode, setBarcode] = useState("");
  const [feedback, setFeedback] = useState("");

  async function load() {
    const [shops, items] = await Promise.all([ownerRows(db.shops), ownerRows(db.products)]);
    setShopId(shops[0]?.id ?? "default-shop");
    setProducts(items.sort((a, b) => a.name.localeCompare(b.name)));
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const actor = await ownerContext(shopId);
    setFeedback("");
    const buyVal = Number(buying || "0");
    const sellVal = Number(selling);
    const qtyVal = Number(qty || "0");
    if (!name.trim() || !Number.isInteger(sellVal) || sellVal <= 0) {
      setFeedback("Enter a product name and a positive integer UGX selling price.");
      return;
    }
    if (!Number.isInteger(buyVal) || buyVal < 0 || !Number.isInteger(qtyVal) || qtyVal < 0) {
      setFeedback("Buying price and opening stock must be non-negative integers.");
      return;
    }
    const id = generateId();
    const now = new Date().toISOString();
    await db.transaction("rw", [db.products, db.stock_movements], async () => {
    await db.products.add({
      id,
      shop_id: shopId,
      name: name.trim(),
      unit: unit.trim() || "pc",
      sku_code: "",
      buying_price: buyVal,
      selling_price: sellVal,
      stock_qty: qtyVal,
      is_fast_mover: true,
      photo_url: "",
      active: true,
      barcode: barcode.trim(),
      published_online: true,
      server_updated_at: now,
    });
    if (qtyVal > 0) {
      await db.stock_movements.add({
        id: generateId(),
        shop_id: shopId,
        product_id: id,
        type: "receive",
        qty_delta: qtyVal,
        reason: "Opening stock from dashboard",
        user_id: actor.userId,
        created_at: now,
        ref_id: id,
      });
    }
    });
    setName("");
    setBuying("");
    setSelling("");
    setQty("0");
    setBarcode("");
    setFeedback("Product added.");
    await load();
  }

  async function togglePublish(product: Product) {
    await ownerContext(shopId);
    const next = !(product.published_online ?? true);
    await db.products.update(product.id, { published_online: next });
    await load();
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
    (p.barcode ?? "").includes(query.trim()),
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-navy">Products</h1>
            <StatusBadge state="now" />
          </div>
          <p className="mt-1 text-sm text-navy/65">
            Manage catalogue items, integer UGX prices, barcodes and online storefront visibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/products/bulk-csv" className="btn-secondary gap-1.5 text-xs">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Bulk CSV import
          </Link>
          <Link href="/app/products/copy-branch" className="btn-secondary gap-1.5 text-xs">
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy from branch
          </Link>
        </div>
      </header>

      <form onSubmit={handleAdd} className="card space-y-4">
        <h2 className="flex items-center gap-2 text-base font-bold text-navy">
          <PackagePlus className="h-4 w-4" aria-hidden="true" />
          Add single product
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Input
              label="Product name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sugar 1kg"
            />
          </div>
          <Input
            label="Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="pc / kg / L"
          />
          <Input
            label="Buy (UGX)"
            type="number"
            min={0}
            value={buying}
            onChange={(e) => setBuying(e.target.value)}
            placeholder="4200"
          />
          <Input
            label="Sell (UGX)"
            type="number"
            min={1}
            required
            value={selling}
            onChange={(e) => setSelling(e.target.value)}
            placeholder="5000"
          />
          <Input
            label="Opening qty"
            type="number"
            min={0}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-64">
            <Input
              label="Barcode / QR (optional)"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="6001234567890"
            />
          </div>
          <button type="submit" className="btn-primary text-sm">
            Save product
          </button>
          {feedback ? (
            <p className="text-xs font-semibold text-navy">{feedback}</p>
          ) : null}
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products or barcode..."
          aria-label="Search products"
          className="min-h-11 w-full rounded-xl border border-navy/20 bg-white px-4 py-2 text-sm text-navy sm:w-80"
        />
        <p className="text-xs font-bold text-navy/60">
          {filtered.length} products
        </p>
      </div>

      <DataTable
        rows={filtered}
        rowKey={(row) => row.id}
        emptyMessage="No products in this shop yet. Add your first item above or import via CSV."
        columns={[
          {
            key: "name",
            header: "Product",
            render: (row) => (
              <div>
                <p className="font-bold text-navy">{row.name}</p>
                <p className="text-xs text-navy/60">
                  {row.unit}
                  {row.barcode ? ` · ${row.barcode}` : ""}
                </p>
              </div>
            ),
          },
          {
            key: "buy",
            header: "Buy",
            align: "right",
            numeric: true,
            render: (row) => ugx(row.buying_price),
          },
          {
            key: "sell",
            header: "Sell",
            align: "right",
            numeric: true,
            render: (row) => ugx(row.selling_price),
          },
          {
            key: "stock",
            header: "Stock",
            align: "right",
            numeric: true,
            render: (row) => String(row.stock_qty),
          },
          {
            key: "online",
            header: "Online store",
            render: (row) => {
              const live = row.published_online ?? true;
              return (
                <button
                  type="button"
                  onClick={() => togglePublish(row)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    live ? "bg-teal-soft text-navy" : "bg-navy/5 text-navy/65"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  {live ? "Published" : "Hidden"}
                </button>
              );
            },
          },
        ]}
      />
    </div>
  );
}
