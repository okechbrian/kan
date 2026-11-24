"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, type Product } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/session";
import { receiveStock } from "../../../lib/stock";
import { ugx } from "../../../lib/money";

type Line = { product: Product; qty: number; unitCost: number };

function ReceiveInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<Line[]>([]);
  const [picking, setPicking] = useState(true);
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [picked, setPicked] = useState<Product | null>(null);
  const [supplier, setSupplier] = useState("");
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
        if (p) {
          setPicked(p);
          setUnitCost(p.buying_price);
          setPicking(false);
        }
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

  const addLine = () => {
    if (!picked || qty <= 0) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === picked.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === picked.id
            ? { ...l, qty: l.qty + qty, unitCost }
            : l
        );
      }
      return [...prev, { product: picked, qty, unitCost }];
    });
    setPicked(null);
    setQty(1);
    setUnitCost(0);
    setPicking(true);
  };

  const handleConfirm = async () => {
    const user = await getCurrentUser();
    if (!user || saving || lines.length === 0) return;
    setSaving(true);
    try {
      await receiveStock({
        shopId: user.shopId,
        userId: user.userId,
        supplier,
        lines: lines.map((l) => ({
          productId: l.product.id,
          qty: l.qty,
          unitCost: l.unitCost,
        })),
      });
      router.push("/stock");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
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

  return (
    <main className="min-h-screen bg-gray-50 pb-8 mx-auto max-w-[420px]">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              !picking && picked
                ? (setPicked(null), setPicking(true))
                : router.push("/stock")
            }
            className="text-blue-600 text-sm font-medium"
          >
            Cancel
          </button>
          <h1 className="text-lg font-bold">Receive goods</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        {lines.length > 0 && (
          <div className="space-y-1.5">
            {lines.map((l) => (
              <div
                key={l.product.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{l.product.name}</p>
                  <p className="text-xs text-gray-500">
                    {l.qty} {l.product.unit} · {ugx(l.unitCost)} each
                  </p>
                </div>
                <button
                  onClick={() =>
                    setLines((prev) =>
                      prev.filter((x) => x.product.id !== l.product.id)
                    )
                  }
                  className="text-red-500 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {picking && !picked && (
          <>
            <input
              type="text"
              placeholder="Find item to receive"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500"
            />
            <div className="space-y-1.5">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPicked(p);
                    setUnitCost(p.buying_price);
                    setQty(1);
                    setPicking(false);
                  }}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left"
                >
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-gray-500">
                    {p.stock_qty} {p.unit}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {picked && (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
            <p className="font-medium">{picked.name}</p>
            <label className="block text-sm text-gray-700">
              Qty in
              <input
                type="text"
                inputMode="numeric"
                value={qty}
                onChange={(e) =>
                  setQty(parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0)
                }
                className="mt-1 w-full rounded-lg border px-4 py-2 text-center"
              />
            </label>
            <label className="block text-sm text-gray-700">
              Unit cost (UGX)
              <input
                type="text"
                inputMode="numeric"
                value={unitCost}
                onChange={(e) =>
                  setUnitCost(
                    parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0
                  )
                }
                className="mt-1 w-full rounded-lg border px-4 py-2 text-center"
              />
            </label>
            <button
              onClick={addLine}
              disabled={qty <= 0}
              className="w-full rounded-lg border border-blue-300 py-2 text-blue-700 text-sm font-medium disabled:opacity-40"
            >
              Add line
            </button>
          </div>
        )}

        <label className="block text-sm text-gray-700">
          Supplier (optional)
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g. Kikuubo"
            className="mt-1 w-full rounded-lg border px-4 py-2"
          />
        </label>

        <button
          onClick={() => void handleConfirm()}
          disabled={lines.length === 0 || saving}
          className="w-full rounded-lg bg-blue-600 py-3 text-white text-lg font-semibold disabled:opacity-50 disabled:bg-gray-300"
        >
          {saving ? "Saving..." : "Add to stock"}
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg z-50">
          {toast}
        </div>
      )}
    </main>
  );
}

export default function ReceivePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </main>
      }
    >
      <ReceiveInner />
    </Suspense>
  );
}
