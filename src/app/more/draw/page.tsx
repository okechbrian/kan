"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "../../../lib/db";
import { getSession, getCurrentUser } from "../../../lib/session";
import { generateId } from "../../../lib/uuid";
import { ugx } from "../../../lib/money";

export default function DrawPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user || user.role !== "owner") {
        router.replace("/more");
        return;
      }
      const openShift = await db.shifts
        .where("[shop_id+status]")
        .equals([user.shopId, "open"])
        .first();
      if (!openShift) {
        setToast("No open shift");
        setTimeout(() => router.replace("/more"), 1500);
        return;
      }
      setShiftId(openShift.id);
    }
    load();
  }, [router]);

  const handleDraw = async () => {
    const session = getSession();
    if (!session || !shiftId || saving) return;
    if (!Number.isInteger(amount) || amount <= 0) return;
    if (!reason.trim()) return;

    setSaving(true);
    try {
      await db.cash_movements.add({
        id: generateId(),
        shop_id: session.shopId,
        shift_id: shiftId,
        type: "draw",
        amount,
        reason: reason.trim(),
        user_id: session.userId,
        created_at: new Date().toISOString(),
      });

      setToast(`Drew ${ugx(amount)}`);
      setTimeout(() => router.push("/more"), 1500);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm font-semibold text-kan-teal"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-lg font-bold">Owner draw</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="space-y-4 p-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-kan-navy">
            Amount (UGX)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setAmount(parseInt(raw, 10) || 0);
            }}
            className="ugx-amount w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-3 text-center text-lg font-bold text-kan-navy outline-none focus:border-kan-navy"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-kan-navy">
            Reason
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. lunch, home"
            className="w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-2.5 text-sm text-kan-navy outline-none focus:border-kan-navy"
          />
        </div>

        <button
          type="button"
          onClick={handleDraw}
          disabled={
            !Number.isInteger(amount) ||
            amount <= 0 ||
            !reason.trim() ||
            saving
          }
          className="min-h-[48px] w-full rounded-xl bg-kan-guava py-3 text-base font-bold text-kan-navy disabled:bg-kan-navy/20 disabled:text-kan-navy/50"
        >
          {saving ? "Recording..." : "Draw from till"}
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
