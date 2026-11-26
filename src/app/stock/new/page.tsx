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
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-8">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-semibold text-kan-teal"
          >
            Cancel
          </button>
          <h1 className="text-lg font-bold">Add product</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="space-y-4 p-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-kan-navy">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sugar 1kg"
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

        <div>
          <label className="mb-1 block text-sm font-semibold text-kan-navy">
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
            className="ugx-amount w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 font-bold text-kan-navy outline-none focus:border-kan-navy"
          />
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
              Shows on the sell grid for quick access
            </p>
          </div>
        </label>

        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || !Number.isInteger(sellingPrice) || saving}
          className="min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white disabled:bg-kan-navy/25"
        >
          {saving ? "Saving..." : "Add product"}
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-kan-navy px-4 py-2 text-sm font-bold text-kan-teal shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
