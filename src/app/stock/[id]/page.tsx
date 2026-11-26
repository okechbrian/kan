"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db, type Product } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/session";
import { ugx } from "../../../lib/money";

const UNITS = ["pc", "kg", "g", "l", "ml", "packet", "dozen", "sachet"];

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pc");
  const [sellingPrice, setSellingPrice] = useState(0);
  const [buyingPrice, setBuyingPrice] = useState(0);
  const [isFastMover, setIsFastMover] = useState(false);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/pin");
        return;
      }
      setIsOwner(user.role === "owner");
      const p = await db.products.get(productId);
      if (!p || p.shop_id !== user.shopId) {
        router.replace("/stock");
        return;
      }
      setProduct(p);
      setName(p.name);
      setUnit(p.unit);
      setSellingPrice(p.selling_price);
      setBuyingPrice(p.buying_price);
      setIsFastMover(p.is_fast_mover);
      setActive(p.active);
      setLoading(false);
    }
    load();
  }, [productId, router]);

  const handleSave = async () => {
    if (!product || saving) return;
    if (!name.trim()) return;

    setSaving(true);
    try {
      await db.products
        .where("id")
        .equals(product.id)
        .modify((p) => {
          p.name = name.trim();
          p.unit = unit;
          p.selling_price = sellingPrice;
          p.buying_price = buyingPrice;
          p.is_fast_mover = isFastMover;
          p.active = active;
        });

      const updated = await db.products.get(product.id);
      if (updated) setProduct(updated);
      setEditing(false);
      setToast("Saved");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-kan-white">
        <p className="text-sm text-kan-navy/60">Loading...</p>
      </main>
    );
  }

  if (!product) return null;

  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-8">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-semibold text-kan-teal"
          >
            Back
          </button>
          <h1 className="text-lg font-bold">
            {editing ? "Edit product" : "Product"}
          </h1>
          {isOwner ? (
            <button
              type="button"
              onClick={() => (editing ? handleSave() : setEditing(true))}
              disabled={saving}
              className="rounded-lg bg-kan-teal px-3 py-1 text-xs font-bold text-kan-navy"
            >
              {editing ? (saving ? "Saving..." : "Save") : "Edit"}
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </header>

      <div className="space-y-4 p-4">
        {editing ? (
          <>
            <div>
              <label className="mb-1 block text-sm font-semibold text-kan-navy">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-kan-navy">
                Unit
              </label>
              <div className="flex flex-wrap gap-2">
                {UNITS.map((u) => (
                  <button
                    type="button"
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-bold ${
                      unit === u
                        ? "border-kan-navy bg-kan-navy text-kan-white"
                        : "border-kan-navy/20 bg-white text-kan-navy"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-kan-navy">
                  Selling price (UGX)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sellingPrice}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setSellingPrice(parseInt(raw, 10) || 0);
                  }}
                  className="ugx-amount w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 font-bold text-kan-navy outline-none focus:border-kan-navy"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-kan-navy">
                  Buying price (UGX)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={buyingPrice}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    setBuyingPrice(parseInt(raw, 10) || 0);
                  }}
                  className="ugx-amount w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 font-bold text-kan-navy outline-none focus:border-kan-navy"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-kan-navy/10 bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={isFastMover}
                onChange={(e) => setIsFastMover(e.target.checked)}
                className="h-5 w-5 rounded accent-kan-navy"
              />
              <div>
                <p className="text-sm font-bold text-kan-navy">Fast mover</p>
                <p className="text-xs text-kan-navy/60">
                  Shows on the sell grid
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-kan-navy/10 bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-5 w-5 rounded accent-kan-navy"
              />
              <div>
                <p className="text-sm font-bold text-kan-navy">Active</p>
                <p className="text-xs text-kan-navy/60">
                  Visible on sell screen
                </p>
              </div>
            </label>
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-3 rounded-2xl border border-kan-navy/10 bg-white p-4 shadow-sm">
              <div className="flex justify-between">
                <span className="text-sm text-kan-navy/60">Name</span>
                <span className="font-bold text-kan-navy">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-kan-navy/60">Unit</span>
                <span className="font-semibold text-kan-navy">
                  {product.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-kan-navy/60">Selling price</span>
                <span className="ugx-amount font-bold text-kan-navy">
                  {ugx(product.selling_price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-kan-navy/60">Buying price</span>
                <span className="ugx-amount font-semibold text-kan-navy">
                  {product.buying_price > 0 ? ugx(product.buying_price) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-kan-navy/60">Stock</span>
                <span
                  className={`ugx-amount rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    product.stock_qty <= 5
                      ? "bg-kan-guava/25 text-kan-navy"
                      : "bg-kan-teal/20 text-kan-navy"
                  }`}
                >
                  {product.stock_qty} {product.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-kan-navy/60">Fast mover</span>
                <span className="font-semibold text-kan-navy">
                  {product.is_fast_mover ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-kan-navy/60">Active</span>
                <span className="font-semibold text-kan-navy">
                  {product.active ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/stock/adjust?product=${product.id}`)
                  }
                  className="min-h-[44px] flex-1 rounded-xl border border-kan-navy/20 bg-white py-2.5 text-sm font-bold text-kan-navy"
                >
                  Adjust stock
                </button>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/stock/receive?product=${product.id}`)
                  }
                  className="min-h-[44px] flex-1 rounded-xl bg-kan-navy py-2.5 text-sm font-bold text-kan-white"
                >
                  Receive goods
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-kan-navy px-4 py-2 text-sm font-bold text-kan-teal shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
