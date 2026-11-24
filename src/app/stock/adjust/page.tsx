"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, type Product } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/session";
import { adjustStock } from "../../../lib/stock";

const REASONS = ["Theft", "Breakage", "Count correction", "Other"] as const;

function AdjustInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [picked, setPicked] = useState<Product | null>(null);
  const [countedQty, setCountedQty] = useState(0);
  const [reason, setReason] = useState<string>("");
  const [otherNote, setOtherNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/pin");
        return;
      }
      if (user.role !== "owner") {
        router.replace("/stock");
        return;
      }
      const items = await db.products
        .where("shop_id")
        .equals(user.shopId)
        .filter((p) => p.active)
        .toArray();
      items.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(items);
      const pre = searchParams.get("product");
      if (pre) {
        const p = items.find((i) => i.id === pre);
        if (p) handlePick(p);
      }
      setLoading(false);
    }
    load();
  }, [router, searchParams]);

  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const handlePick = (product: Product) => {
    setPicked(product);
    setCountedQty(product.stock_qty);
    setReason("");
    setOtherNote("");
  };

  const delta = picked ? countedQty - picked.stock_qty : 0;

  const handleAdjust = async () => {
    const user = await getCurrentUser();
    if (!user || !picked || saving) return;
    if (!Number.isInteger(countedQty) || countedQty < 0) return;
    if (!reason) return;
    if (reason === "Other" && !otherNote.trim()) return;

    setSaving(true);
    try {
      const reasonText = reason === "Other" ? otherNote.trim() : reason;
      await adjustStock({
        shopId: user.shopId,
        userId: user.userId,
        productId: picked.id,
        countedQty,
        reason: reasonText,
      });
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
            onClick={() => (picked ? setPicked(null) : router.back())}
            className="text-blue-600 text-sm font-medium"
          >
            {picked ? "Back" : "Cancel"}
          </button>
          <h1 className="text-lg font-bold">
            {picked ? "Adjust stock" : "Pick product"}
          </h1>
          <div className="w-12" />
        </div>
      </header>

      {!picked ? (
        <div className="p-4">
          <input
            type="text"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 mb-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />

          {loading ? (
            <p className="text-center text-gray-500 py-12">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No products found</p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePick(p)}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left active:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.unit}</p>
                  </div>
                  <p className="font-bold text-sm">
                    {p.stock_qty} {p.unit}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="font-medium">{picked.name}</p>
            <p className="text-xs text-gray-500">
              System shows: {picked.stock_qty} {picked.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual counted qty
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={countedQty}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setCountedQty(parseInt(raw, 10) || 0);
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {delta !== 0 && (
              <p
                className={`text-center text-sm mt-1 font-medium ${
                  delta > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} {picked.unit}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`rounded-lg border py-2.5 text-sm font-medium ${
                    reason === r
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 active:bg-gray-100"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {reason === "Other" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <input
                type="text"
                value={otherNote}
                onChange={(e) => setOtherNote(e.target.value)}
                placeholder="What happened?"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          )}

          <button
            onClick={handleAdjust}
            disabled={
              !Number.isInteger(countedQty) ||
              !reason ||
              (reason === "Other" && !otherNote.trim()) ||
              saving
            }
            className="w-full rounded-lg bg-blue-600 py-3 text-white text-lg font-semibold active:bg-blue-700 disabled:opacity-50 disabled:bg-gray-300"
          >
            {saving ? "Saving..." : "Confirm adjustment"}
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}
    </main>
  );
}

export default function AdjustPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </main>
      }
    >
      <AdjustInner />
    </Suspense>
  );
}
