"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db, type Product, type Shift } from "../../lib/db";
import { getSession } from "../../lib/session";
import { ugx } from "../../lib/money";
import { recordSale } from "../../lib/sale";
import { CartSheet, type CartLine } from "../../components/CartSheet";
import { PayModal, type PayTender } from "../../components/PayModal";
import { BottomNav } from "../../components/BottomNav";
import { OnlinePill } from "../../components/OnlinePill";

export default function SellPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [shift, setShift] = useState<Shift | null>(null);
  const [shopName, setShopName] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showPay, setShowPay] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const sellingRef = useRef(false);

  useEffect(() => {
    async function load() {
      const session = getSession();
      if (!session) {
        router.replace("/pin");
        return;
      }

      const shops = await db.shops.toArray();
      const currentShop = shops.find((s) => s.id === session.shopId);
      setShopName(currentShop?.name ?? "");
      setMomoNumber(currentShop?.momo_number ?? "");

      const openShift = await db.shifts
        .where("[shop_id+status]")
        .equals([session.shopId, "open"])
        .first();
      if (!openShift) {
        router.replace("/shift/open");
        return;
      }
      setShift(openShift);

      const items = await db.products
        .where("shop_id")
        .equals(session.shopId)
        .filter((p) => p.active)
        .toArray();
      setProducts(items);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const fastMovers = filtered.filter((p) => p.is_fast_mover);
  const others = filtered.filter((p) => !p.is_fast_mover);
  const lowStockCount = products.filter((p) => p.stock_qty <= 5).length;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.selling_price,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.productId !== productId));
    } else {
      setCart((prev) =>
        prev.map((l) => (l.productId === productId ? { ...l, qty } : l))
      );
    }
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  const handleConfirmSale = async (
    tenders: PayTender[],
    customerId?: string | null
  ) => {
    const session = getSession();
    if (!session || !shift || sellingRef.current) return;
    sellingRef.current = true;
    setSaving(true);
    try {
      await recordSale({
        shopId: session.shopId,
        shiftId: shift.id,
        userId: session.userId,
        lines: cart.map((line) => ({
          productId: line.productId,
          qty: line.qty,
          unitPrice: line.unitPrice,
        })),
        tenders,
        customerId,
      });
      const items = await db.products
        .where("shop_id")
        .equals(session.shopId)
        .filter((p) => p.active)
        .toArray();
      setProducts(items);
      setCart([]);
      setShowPay(false);
      setToast("Sold");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Sale failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      sellingRef.current = false;
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
    <main className="min-h-screen bg-gray-50 pb-72 mx-auto max-w-[420px]">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{shopName}</h1>
          <div className="flex items-center gap-2">
            {shift && (
              <span className="text-xs text-green-600 font-medium">
                Till open
              </span>
            )}
            <OnlinePill />
          </div>
        </div>
      </header>

      {lowStockCount > 0 && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2">
          <p className="text-xs text-orange-700 font-medium">
            {lowStockCount} {lowStockCount === 1 ? "item" : "items"} low on
            stock ·{" "}
            <a href="/stock" className="underline">
              View stock
            </a>
          </p>
        </div>
      )}

      <div className="p-4">
        <input
          type="text"
          placeholder="Find item"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 mb-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />

        {fastMovers.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Fast movers
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {fastMovers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="rounded-lg border border-gray-200 bg-white p-3 text-left active:bg-gray-100"
                >
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-green-700 font-bold text-sm">
                    {ugx(p.selling_price)}
                  </p>
                  {p.stock_qty <= 5 && (
                    <p
                      className={`text-xs mt-0.5 ${
                        p.stock_qty === 0
                          ? "text-red-600"
                          : "text-orange-500"
                      }`}
                    >
                      {p.stock_qty === 0
                        ? "Stock not counted"
                        : `Qty: ${p.stock_qty}`}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Other items
            </h2>
            <div className="space-y-1">
              {others.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left active:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.unit}</p>
                  </div>
                  <p className="text-green-700 font-bold text-sm">
                    {ugx(p.selling_price)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {fastMovers.length === 0 && others.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No products found.</p>
            <p className="text-sm mt-1">
              Add sugar, oil, soap before you can sell.
            </p>
          </div>
        )}
      </div>

      <CartSheet
        lines={cart}
        onUpdateQty={updateQty}
        onRemove={removeLine}
        onCharge={() => setShowPay(true)}
      />

      {showPay && (
        <PayModal
          total={cartTotal}
          momoNumber={momoNumber}
          onConfirm={handleConfirmSale}
          onCancel={() => setShowPay(false)}
          confirming={saving}
        />
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
