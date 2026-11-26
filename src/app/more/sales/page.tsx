"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { db, type Sale } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/session";
import { voidSale } from "../../../lib/sale";
import { ugx } from "../../../lib/money";
import {
  ReceiptModal,
  type ReceiptData,
} from "../../../components/ReceiptModal";

function todayPrefix(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TodaysSalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [shopName, setShopName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [voiding, setVoiding] = useState<Sale | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  async function reload(shopId: string) {
    const prefix = todayPrefix();
    const rows = await db.sales
      .where("shop_id")
      .equals(shopId)
      .filter((s) => s.created_at.startsWith(prefix))
      .toArray();
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    setSales(rows);
  }

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/pin");
        return;
      }
      setIsOwner(user.role === "owner");
      const shop = await db.shops.get(user.shopId);
      setShopName(shop?.name ?? "Kan Shop");
      await reload(user.shopId);
    }
    load();
  }, [router]);

  const openReceipt = async (sale: Sale) => {
    const [saleLines, tenders, products] = await Promise.all([
      db.sale_lines.where("sale_id").equals(sale.id).toArray(),
      db.tenders.where("sale_id").equals(sale.id).toArray(),
      db.products.where("shop_id").equals(sale.shop_id).toArray(),
    ]);
    const productById = new Map(products.map((p) => [p.id, p.name]));
    setReceipt({
      saleId: sale.id,
      shopName,
      createdAt: sale.created_at,
      total: sale.total,
      status: sale.status,
      lines: saleLines.map((l) => ({
        name: productById.get(l.product_id) ?? "Item",
        qty: l.qty,
        unitPrice: l.unit_price,
      })),
      tenders: tenders.map((t) => ({ method: t.method, amount: t.amount })),
    });
  };

  const handleVoid = async () => {
    const user = await getCurrentUser();
    if (!user || !voiding || saving) return;
    setSaving(true);
    try {
      await voidSale({
        saleId: voiding.id,
        reason,
        userId: user.userId,
      });
      await reload(user.shopId);
      setVoiding(null);
      setReason("");
      setToast("Sale voided");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-8">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-kan-navy px-4 py-3 text-kan-white shadow-sm print:hidden">
        <button
          type="button"
          onClick={() => router.push("/more")}
          className="inline-flex items-center gap-1 text-sm font-semibold text-kan-teal"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-lg font-bold">Today&apos;s sales</h1>
        <div className="w-12" />
      </header>
      <div className="space-y-2 p-4 print:hidden">
        {sales.length === 0 ? (
          <div className="rounded-2xl border border-kan-navy/10 bg-white px-4 py-12 text-center text-sm text-kan-navy/65">
            No sales today.
          </div>
        ) : (
          sales.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-kan-navy/10 bg-white px-3.5 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="ugx-amount font-bold text-kan-navy">
                    {ugx(s.total)}
                  </p>
                  <p className="text-xs text-kan-navy/55">
                    {s.created_at.slice(11, 16)}
                    {s.status === "voided" ? " · Voided" : ""}
                  </p>
                  {s.status === "voided" && s.void_reason && (
                    <p className="text-xs text-kan-navy/65">{s.void_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openReceipt(s)}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-kan-navy/20 px-2.5 py-1 text-xs font-bold text-kan-navy"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Receipt
                  </button>
                  {isOwner && s.status === "completed" && (
                    <button
                      type="button"
                      onClick={() => {
                        setVoiding(s);
                        setReason("");
                      }}
                      className="min-h-[34px] rounded-lg bg-kan-guava/25 px-2.5 py-1 text-xs font-bold text-kan-navy"
                    >
                      Void
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      )}

      {voiding && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-kan-navy/60 backdrop-blur-[1px]">
          <div className="w-full max-w-[420px] rounded-t-2xl bg-kan-white p-4 pb-8 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-kan-navy">Void sale</h2>
            <p className="ugx-amount mb-3 text-sm text-kan-navy/70">
              {ugx(voiding.total)} — stock and deni will reverse.
            </p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason required"
              className="mb-3 w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVoiding(null)}
                className="min-h-[44px] flex-1 rounded-xl border border-kan-navy/20 bg-white py-2.5 text-sm font-semibold text-kan-navy"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleVoid()}
                disabled={!reason.trim() || saving}
                className="min-h-[44px] flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "Voiding..." : "Void sale"}
              </button>
            </div>
          </div>
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
