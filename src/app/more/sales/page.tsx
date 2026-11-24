"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, type Sale } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/session";
import { voidSale } from "../../../lib/sale";
import { ugx } from "../../../lib/money";

function todayPrefix(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TodaysSalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [voiding, setVoiding] = useState<Sale | null>(null);
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
      await reload(user.shopId);
    }
    load();
  }, [router]);

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
    <main className="min-h-screen bg-gray-50 mx-auto max-w-[420px] pb-8">
      <header className="sticky top-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/more")}
          className="text-blue-600 text-sm font-medium"
        >
          Back
        </button>
        <h1 className="text-lg font-bold">Today&apos;s sales</h1>
        <div className="w-12" />
      </header>
      <div className="p-4 space-y-2">
        {sales.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No sales today.</p>
        ) : (
          sales.map((s) => (
            <div
              key={s.id}
              className="rounded-lg border border-gray-200 bg-white px-3 py-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ugx(s.total)}</p>
                  <p className="text-xs text-gray-400">
                    {s.created_at.slice(11, 16)}
                    {s.status === "voided" ? " · Voided" : ""}
                  </p>
                  {s.status === "voided" && s.void_reason && (
                    <p className="text-xs text-gray-500">{s.void_reason}</p>
                  )}
                </div>
                {isOwner && s.status === "completed" && (
                  <button
                    onClick={() => {
                      setVoiding(s);
                      setReason("");
                    }}
                    className="text-xs font-medium text-red-600"
                  >
                    Void
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {voiding && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-4 pb-8">
            <h2 className="text-lg font-bold mb-1">Void sale</h2>
            <p className="text-sm text-gray-500 mb-3">
              {ugx(voiding.total)} — stock and deni will reverse.
            </p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason required"
              className="w-full rounded-lg border px-4 py-2.5 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setVoiding(null)}
                className="flex-1 rounded-lg border py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleVoid()}
                disabled={!reason.trim() || saving}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Voiding..." : "Void sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg z-50">
          {toast}
        </div>
      )}
    </main>
  );
}
