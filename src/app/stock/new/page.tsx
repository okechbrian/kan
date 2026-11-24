"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/session";
import { generateId } from "../../../lib/uuid";

const UNITS = ["pc", "kg", "g", "l", "ml", "packet", "dozen", "sachet"];

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pc");
  const [sellingPrice, setSellingPrice] = useState(0);
  const [buyingPrice, setBuyingPrice] = useState(0);
  const [openingStock, setOpeningStock] = useState(0);
  const [isFastMover, setIsFastMover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const handleSave = async () => {
    const user = await getCurrentUser();
    if (!user || saving) return;
    if (user.role !== "owner") return;
    if (!name.trim()) return;
    if (!Number.isInteger(sellingPrice) || sellingPrice < 0) return;
    if (!Number.isInteger(buyingPrice) || buyingPrice < 0) return;
    if (!Number.isInteger(openingStock) || openingStock < 0) return;

    setSaving(true);
    try {
      const id = generateId();
      const now = new Date().toISOString();

      await db.transaction(
        "rw",
        [db.products, db.stock_movements],
        async () => {
          await db.products.add({
            id,
            shop_id: user.shopId,
            name: name.trim(),
            unit,
            sku_code: "",
            selling_price: sellingPrice,
            buying_price: buyingPrice,
            stock_qty: openingStock,
            is_fast_mover: isFastMover,
            photo_url: "",
            active: true,
            server_updated_at: new Date().toISOString(),
          });

          if (openingStock > 0) {
            await db.stock_movements.add({
              id: generateId(),
              shop_id: user.shopId,
              product_id: id,
              type: "receive",
              qty_delta: openingStock,
              reason: "Opening stock",
              user_id: user.userId,
              created_at: now,
              ref_id: "",
            });
          }
        }
      );

      setToast("Product added");
      setTimeout(() => setToast(""), 2000);
      router.push("/stock");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium"
          >
            Cancel
          </button>
          <h1 className="text-lg font-bold">Add product</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sugar 1kg"
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
              Selling price (UGX) *
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opening stock
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={openingStock}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setOpeningStock(parseInt(raw, 10) || 0);
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
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
              Shows on the sell grid for quick access
            </p>
          </div>
        </label>

        <button
          onClick={handleSave}
          disabled={!name.trim() || !Number.isInteger(sellingPrice) || saving}
          className="w-full rounded-lg bg-green-600 py-3 text-white text-lg font-semibold active:bg-green-700 disabled:opacity-50 disabled:bg-gray-300"
        >
          {saving ? "Saving..." : "Add product"}
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}
    </main>
  );
}
