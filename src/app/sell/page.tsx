"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Printer, Search } from "lucide-react";
import { db, type Product, type Shift } from "../../lib/db";
import { getSession } from "../../lib/session";
import { ugx } from "../../lib/money";
import { recordSale } from "../../lib/sale";
import { CartSheet, type CartLine } from "../../components/CartSheet";
import { PayModal, type PayTender } from "../../components/PayModal";
import { BottomNav } from "../../components/BottomNav";
import { OnlinePill } from "../../components/OnlinePill";
import { KanLogo } from "../../components/brand/KanLogo";
import { ReceiptModal, type ReceiptData } from "../../components/ReceiptModal";

export default function SellPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [shift, setShift] = useState<Shift | null>(null);
  const [shopName, setShopName] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showPay, setShowPay] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
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
    const snapshotLines = cart.map((l) => ({
      name: l.name,
      qty: l.qty,
      unitPrice: l.unitPrice,
    }));
    const totalSnap = cartTotal;
    try {
      const result = await recordSale({
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
      setLastReceipt({
        saleId: result.saleId,
        shopName,
        createdAt: new Date().toISOString(),
        lines: snapshotLines,
        tenders: tenders.map((t) => ({ method: t.method, amount: t.amount })),
        total: totalSnap,
      });
      setToast("Sold");
      setTimeout(() => setToast(""), 4500);
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-kan-white">
        <KanLogo variant="navy" className="h-8 w-auto min-w-[80px]" />
        <p className="text-sm text-kan-navy/60">Loading till...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-72">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm print:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <KanLogo variant="primary" className="h-5 w-auto min-w-[60px]" />
            <h1 className="truncate text-base font-bold">{shopName}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {shift && (
              <span className="rounded-full bg-kan-teal/20 px-2 py-0.5 text-[11px] font-bold text-kan-teal">
                Till open
              </span>
            )}
            <OnlinePill onDark />
          </div>
        </div>
      </header>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 border-b border-kan-guava/40 bg-kan-guava/20 px-4 py-2 print:hidden">
          <AlertTriangle className="h-4 w-4 shrink-0 text-kan-navy" />
          <p className="text-xs font-semibold text-kan-navy">
            {lowStockCount} {lowStockCount === 1 ? "item" : "items"} low on
            stock ·{" "}
            <Link href="/stock" className="underline">
              View stock
            </Link>
          </p>
        </div>
      )}

      <div className="p-4 print:hidden">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-kan-navy/50" />
          <input
            type="text"
            placeholder="Find item or scan barcode"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-kan-navy/20 bg-white py-3 pr-4 pl-10 text-sm font-medium text-kan-navy outline-none focus:border-kan-navy"
          />
        </div>

        {fastMovers.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-kan-navy/60">
              Fast movers
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {fastMovers.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex min-h-[78px] flex-col justify-between rounded-xl border border-kan-navy/15 bg-white p-3 text-left shadow-sm transition-colors active:border-kan-teal active:bg-kan-teal/10"
                >
                  <p className="line-clamp-2 text-sm font-bold text-kan-navy">
                    {p.name}
                  </p>
                  <div className="mt-1.5 flex items-baseline justify-between gap-1">
                    <p className="ugx-amount text-sm font-bold text-kan-navy">
                      {ugx(p.selling_price)}
                    </p>
                    {p.stock_qty <= 5 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          p.stock_qty <= 0
                            ? "bg-kan-guava text-kan-navy"
                            : "bg-kan-guava/25 text-kan-navy"
                        }`}
                      >
                        {p.stock_qty === 0
                          ? "Not counted"
                          : `Qty: ${p.stock_qty}`}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-kan-navy/60">
              Other items
            </h2>
            <div className="space-y-1.5">
              {others.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex min-h-[52px] w-full items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-3.5 py-2.5 text-left active:bg-kan-teal/10"
                >
                  <div>
                    <p className="text-sm font-semibold text-kan-navy">
                      {p.name}
                    </p>
                    <p className="text-xs text-kan-navy/55">{p.unit}</p>
                  </div>
                  <p className="ugx-amount text-sm font-bold text-kan-navy">
                    {ugx(p.selling_price)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {fastMovers.length === 0 && others.length === 0 && (
          <div className="rounded-2xl border border-kan-navy/10 bg-white px-4 py-12 text-center text-kan-navy/70">
            <p className="font-bold text-kan-navy">No products found.</p>
            <p className="mt-1 text-sm">
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

      {showReceipt && lastReceipt && (
        <ReceiptModal
          receipt={lastReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-kan-navy px-4 py-2.5 text-sm font-bold text-kan-white shadow-xl print:hidden">
          <span className="text-kan-teal">{toast}</span>
          {toast === "Sold" && lastReceipt && (
            <button
              type="button"
              onClick={() => {
                setShowReceipt(true);
                setToast("");
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-kan-teal px-2.5 py-1 text-xs font-bold text-kan-navy"
            >
              <Printer className="h-3.5 w-3.5" />
              Receipt
            </button>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
