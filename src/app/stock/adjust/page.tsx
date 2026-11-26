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
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-8">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (picked ? setPicked(null) : router.back())}
            className="text-sm font-semibold text-kan-teal"
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
            className="mb-4 w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
          />

          {loading ? (
            <p className="py-12 text-center text-sm text-kan-navy/60">
              Loading...
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-kan-navy/60">
              No products found
            </p>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handlePick(p)}
                  className="flex min-h-[52px] w-full items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-3.5 py-2.5 text-left active:bg-kan-teal/10"
                >
                  <div>
                    <p className="text-sm font-semibold text-kan-navy">
                      {p.name}
                    </p>
                    <p className="text-xs text-kan-navy/55">{p.unit}</p>
                  </div>
                  <p className="ugx-amount text-sm font-bold text-kan-navy">
                    {p.stock_qty} {p.unit}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 p-4">
          <div className="rounded-xl border border-kan-navy/10 bg-white p-3.5">
            <p className="font-bold text-kan-navy">{picked.name}</p>
            <p className="ugx-amount text-xs text-kan-navy/60">
              System shows: {picked.stock_qty} {picked.unit}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-kan-navy">
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
              className="ugx-amount w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-3 text-center text-lg font-bold text-kan-navy outline-none focus:border-kan-navy"
            />
            {delta !== 0 && (
              <p
                className={`ugx-amount mt-1.5 text-center text-sm font-bold ${
                  delta > 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} {picked.unit}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-kan-navy">
              Reason
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReason(r)}
                  className={`min-h-[44px] rounded-xl border py-2.5 text-sm font-bold ${
                    reason === r
                      ? "border-kan-navy bg-kan-navy text-kan-white"
                      : "border-kan-navy/20 bg-white text-kan-navy"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {reason === "Other" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-kan-navy">
                Note
              </label>
              <input
                type="text"
                value={otherNote}
                onChange={(e) => setOtherNote(e.target.value)}
                placeholder="What happened?"
                className="w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleAdjust}
            disabled={
              !Number.isInteger(countedQty) ||
              !reason ||
              (reason === "Other" && !otherNote.trim()) ||
              saving
            }
            className="min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white disabled:bg-kan-navy/25"
          >
            {saving ? "Saving..." : "Confirm adjustment"}
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-kan-navy px-4 py-2 text-sm font-bold text-kan-teal shadow-lg">
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
        <main className="flex min-h-screen items-center justify-center bg-kan-white">
          <p className="text-sm text-kan-navy/60">Loading...</p>
        </main>
      }
    >
      <AdjustInner />
    </Suspense>
  );
}
