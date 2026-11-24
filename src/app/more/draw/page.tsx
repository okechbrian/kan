"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/db";
import { getSession, getCurrentUser } from "../../../lib/session";
import { generateId } from "../../../lib/uuid";

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

      setToast(`Drew ${amount.toLocaleString()}`);
      setTimeout(() => router.push("/more"), 1500);
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
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium"
          >
            Back
          </button>
          <h1 className="text-lg font-bold">Owner draw</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. lunch, home"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <button
          onClick={handleDraw}
          disabled={
            !Number.isInteger(amount) ||
            amount <= 0 ||
            !reason.trim() ||
            saving
          }
          className="w-full rounded-lg bg-red-600 py-3 text-white text-lg font-semibold active:bg-red-700 disabled:opacity-50 disabled:bg-gray-300"
        >
          {saving ? "Recording..." : "Draw from till"}
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}
    </main>
  );
}
