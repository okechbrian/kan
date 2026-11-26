"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
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
      <main className="flex min-h-screen items-center justify-center bg-kan-white">
        <p className="text-sm text-kan-navy/60">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-8">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              !picking && picked
                ? (setPicked(null), setPicking(true))
                : router.push("/stock")
            }
            className="text-sm font-semibold text-kan-teal"
          >
            Cancel
          </button>
          <h1 className="text-lg font-bold">Receive goods</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="space-y-4 p-4">
        {lines.length > 0 && (
          <div className="space-y-1.5">
            {lines.map((l) => (
              <div
                key={l.product.id}
                className="flex items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-3.5 py-2.5"
              >
                <div>
                  <p className="text-sm font-bold text-kan-navy">
                    {l.product.name}
                  </p>
                  <p className="ugx-amount text-xs text-kan-navy/60">
                    {l.qty} {l.product.unit} · {ugx(l.unitCost)} each
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove line"
                  onClick={() =>
                    setLines((prev) =>
                      prev.filter((x) => x.product.id !== l.product.id)
                    )
                  }
                  className="rounded-lg p-1 text-kan-navy/60 hover:bg-kan-guava/20"
                >
                  <X className="h-4 w-4" />
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
              className="w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
            />
            <div className="space-y-1.5">
              {filtered.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    setPicked(p);
                    setUnitCost(p.buying_price);
                    setQty(1);
                    setPicking(false);
                  }}
                  className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-3.5 py-2.5 text-left active:bg-kan-teal/10"
                >
                  <span className="text-sm font-semibold text-kan-navy">
                    {p.name}
                  </span>
                  <span className="ugx-amount text-xs font-semibold text-kan-navy/60">
                    {p.stock_qty} {p.unit}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {picked && (
          <div className="space-y-3 rounded-2xl border border-kan-navy/15 bg-white p-4 shadow-sm">
            <p className="font-bold text-kan-navy">{picked.name}</p>
            <label className="block text-sm font-semibold text-kan-navy">
              Qty in
              <input
                type="text"
                inputMode="numeric"
                value={qty}
                onChange={(e) =>
                  setQty(
                    parseInt(e.target.value.replace(/[^0-9]/g, ""), 10) || 0
                  )
                }
                className="ugx-amount mt-1 w-full rounded-xl border border-kan-navy/20 px-4 py-2.5 text-center font-bold text-kan-navy outline-none focus:border-kan-navy"
              />
            </label>
            <label className="block text-sm font-semibold text-kan-navy">
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
                className="ugx-amount mt-1 w-full rounded-xl border border-kan-navy/20 px-4 py-2.5 text-center font-bold text-kan-navy outline-none focus:border-kan-navy"
              />
            </label>
            <button
              type="button"
              onClick={addLine}
              disabled={qty <= 0}
              className="min-h-[44px] w-full rounded-xl border border-kan-navy/25 bg-kan-teal/20 py-2 text-sm font-bold text-kan-navy disabled:opacity-40"
            >
              Add line
            </button>
          </div>
        )}

        <label className="block text-sm font-semibold text-kan-navy">
          Supplier (optional)
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="e.g. Kikuubo Wholesale"
            className="mt-1 w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 text-sm font-normal text-kan-navy outline-none focus:border-kan-navy"
          />
        </label>

        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={lines.length === 0 || saving}
          className="min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white disabled:bg-kan-navy/25"
        >
          {saving ? "Saving..." : "Add to stock"}
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

export default function ReceivePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-kan-white">
          <p className="text-sm text-kan-navy/60">Loading...</p>
        </main>
      }
    >
      <ReceiveInner />
    </Suspense>
  );
}
