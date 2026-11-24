"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/db";
import { getSession } from "../../../lib/session";
import { ugx } from "../../../lib/money";
import { closeShift, shiftCashBreakdown } from "../../../lib/till";

export default function CloseTillPage() {
  const router = useRouter();
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [countedCash, setCountedCash] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closed, setClosed] = useState(false);
  const [toast, setToast] = useState("");
  const [breakdown, setBreakdown] = useState<{
    float: number;
    cashSales: number;
    collections: number;
    draws: number;
    expenses: number;
    expected: number;
    momo: number;
    credit: number;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const session = getSession();
      if (!session) {
        router.replace("/pin");
        return;
      }
      const openShift = await db.shifts
        .where("[shop_id+status]")
        .equals([session.shopId, "open"])
        .first();
      if (!openShift) {
        router.replace("/shift/open");
        return;
      }
      setShiftId(openShift.id);
      setBreakdown(await shiftCashBreakdown(openShift.id));
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !breakdown) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  const variance = countedCash - breakdown.expected;

  const handleClose = async () => {
    if (!shiftId || saving) return;
    setSaving(true);
    try {
      await closeShift({ shiftId, countedCash });
      setClosed(true);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (closed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 mx-auto max-w-[420px]">
        <h1 className="text-2xl font-bold mb-2">Till closed</h1>
        <p className="text-sm text-gray-500 mb-1">
          Expected {ugx(breakdown.expected)}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Counted {ugx(countedCash)} ·{" "}
          {variance === 0
            ? "Exact"
            : variance > 0
              ? `Over ${ugx(variance)}`
              : `Short ${ugx(Math.abs(variance))}`}
        </p>
        <button
          onClick={() => router.push("/shift/open")}
          className="w-full rounded-lg bg-blue-600 py-3 text-white text-lg font-semibold"
        >
          Open again
        </button>
        <button
          onClick={() => router.push("/pin")}
          className="mt-3 text-sm text-gray-500"
        >
          Lock
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 mx-auto max-w-[420px]">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm font-medium"
          >
            Back
          </button>
          <h1 className="text-lg font-bold">Close till</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="p-4 space-y-4">
        <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <Row label="Opening float" value={ugx(breakdown.float)} />
          <Row label="Cash sales" value={ugx(breakdown.cashSales)} />
          <Row label="Cash collections" value={ugx(breakdown.collections)} />
          <Row label="Draws" value={ugx(breakdown.draws)} />
          {breakdown.expenses > 0 && (
            <Row label="Expenses" value={ugx(breakdown.expenses)} />
          )}
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500">Expected cash</p>
            <p className="text-3xl font-bold">{ugx(breakdown.expected)}</p>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Counted cash
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={countedCash}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setCountedCash(parseInt(raw, 10) || 0);
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-center outline-none focus:border-blue-500"
          />
          <p
            className={`text-center text-sm mt-2 font-medium ${
              variance === 0
                ? "text-green-600"
                : variance > 0
                  ? "text-blue-600"
                  : "text-red-600"
            }`}
          >
            {variance === 0
              ? "Exact"
              : variance > 0
                ? `Over ${ugx(variance)}`
                : `Short ${ugx(Math.abs(variance))}`}
          </p>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase">
            Not in the box
          </h3>
          <Row label="MoMo recorded" value={ugx(breakdown.momo)} />
          <Row label="Credit sales" value={ugx(breakdown.credit)} />
        </section>

        <button
          onClick={() => void handleClose()}
          disabled={saving}
          className="w-full rounded-lg bg-red-600 py-3 text-white text-lg font-semibold disabled:opacity-50"
        >
          {saving ? "Closing..." : "Close till"}
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-50">
          {toast}
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
