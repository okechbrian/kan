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
      await db.products.where("id").equals(product.id).modify((p) => {
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
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!product) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium"
          >
            Back
          </button>
          <h1 className="text-lg font-bold">
            {editing ? "Edit product" : "Product"}
          </h1>
          {isOwner ? (
            <button
              onClick={() => (editing ? handleSave() : setEditing(true))}
              disabled={saving}
              className="text-blue-600 text-sm font-medium"
            >
              {editing ? (saving ? "Saving..." : "Save") : "Edit"}
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {editing ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <div className="flex flex-wrap gap-2">
                {UNITS.map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      unit === u
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 active:bg-gray-100"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={isFastMover}
                onChange={(e) => setIsFastMover(e.target.checked)}
                className="h-5 w-5 rounded text-blue-600"
              />
              <div>
                <p className="font-medium text-sm">Fast mover</p>
                <p className="text-xs text-gray-500">
                  Shows on the sell grid
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-5 w-5 rounded text-blue-600"
              />
              <div>
                <p className="font-medium text-sm">Active</p>
                <p className="text-xs text-gray-500">
                  Visible on sell screen
                </p>
              </div>
            </label>
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Unit</span>
                <span className="font-medium">{product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Selling price</span>
                <span className="font-medium">{ugx(product.selling_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Buying price</span>
                <span className="font-medium">
                  {product.buying_price > 0 ? ugx(product.buying_price) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Stock</span>
                <span
                  className={`font-bold ${
                    product.stock_qty <= 5
                      ? product.stock_qty === 0
                        ? "text-red-600"
                        : "text-orange-600"
                      : ""
                  }`}
                >
                  {product.stock_qty} {product.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Fast mover</span>
                <span className="font-medium">
                  {product.is_fast_mover ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Active</span>
                <span className="font-medium">
                  {product.active ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() =>
                  router.push(`/stock/adjust?product=${product.id}`)
                }
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-100"
              >
                Adjust stock
              </button>
              <button
                onClick={() =>
                  router.push(`/stock/receive?product=${product.id}`)
                }
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-100"
              >
                Receive goods
              </button>
            </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}
    </main>
  );
}
