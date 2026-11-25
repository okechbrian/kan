"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { db, type Product, type Shop } from "../../lib/db";
import { buildBranchCopyPlan } from "../../lib/dashboard/tools";

export function BranchCopyPanel() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fromShopId, setFromShopId] = useState("");
  const [toShopId, setToShopId] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    const [shopRows, productRows] = await Promise.all([db.shops.toArray(), db.products.toArray()]);
    setShops(shopRows);
    setProducts(productRows);
    if (shopRows[0]) setFromShopId((cur) => cur || shopRows[0].id);
    if (shopRows[1]) setToShopId((cur) => cur || shopRows[1].id);
  }

  useEffect(() => {
    void load();
  }, []);

  const sourceProducts = products.filter((p) => p.shop_id === fromShopId);
  const targetNames = products
    .filter((p) => p.shop_id === toShopId)
    .map((p) => p.name);
  const plan =
    fromShopId && toShopId && fromShopId !== toShopId
      ? buildBranchCopyPlan(sourceProducts, toShopId, targetNames)
      : [];

  async function handleCopy() {
    if (plan.length === 0) return;
    await db.products.bulkAdd(plan);
    setStatus(`Copied ${plan.length} products with opening quantity 0.`);
    await load();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy">Copy catalogue from branch</h1>
          <p className="mt-1 text-sm text-navy/65">
            Copies product names, units and UGX prices with opening stock set to 0.
          </p>
        </div>
        <Link href="/app/products" className="btn-secondary text-sm">
          ← Back to products
        </Link>
      </header>

      {shops.length < 2 ? (
        <div className="card space-y-3">
          <p className="text-sm font-semibold text-navy">
            You need at least two shops on this device to copy products between branches.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shops" className="btn-primary text-xs">
              Manage local shops
            </Link>
            <Link href="/app/business/branch" className="btn-secondary text-xs">
              Cloud branches
            </Link>
          </div>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-bold text-navy">
              <span>Copy from</span>
              <select
                value={fromShopId}
                onChange={(e) => setFromShopId(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-navy/20 bg-white px-3 py-2 text-sm text-navy"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-bold text-navy">
              <span>Copy into</span>
              <select
                value={toShopId}
                onChange={(e) => setToShopId(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-navy/20 bg-white px-3 py-2 text-sm text-navy"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs font-semibold text-navy/75">
            {plan.length} new products ready to copy (duplicates skipped).
          </p>

          <button
            type="button"
            disabled={plan.length === 0}
            onClick={handleCopy}
            className="btn-primary gap-2 text-sm"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy {plan.length} products
          </button>

          {status ? <p className="text-xs font-bold text-navy">{status}</p> : null}
        </div>
      )}
    </div>
  );
}
