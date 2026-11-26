"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "../../../lib/db";
import { getSession } from "../../../lib/session";
import { ugx } from "../../../lib/money";
import { closeShift, shiftCashBreakdown } from "../../../lib/till";
import { KanLogo } from "../../../components/brand/KanLogo";

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
      <main className="flex min-h-screen items-center justify-center bg-kan-white">
        <p className="text-sm text-kan-navy/60">Loading...</p>
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-kan-navy p-4">
        <div className="w-full max-w-sm rounded-2xl bg-kan-white p-6 text-center shadow-xl">
          <KanLogo
            variant="navy"
            className="mx-auto mb-3 h-7 w-auto min-w-[80px]"
          />
          <h1 className="mb-2 text-2xl font-bold text-kan-navy">Till closed</h1>
          <p className="ugx-amount mb-1 text-sm text-kan-navy/70">
            Expected {ugx(breakdown.expected)}
          </p>
          <p className="ugx-amount mb-6 text-sm font-semibold text-kan-navy">
            Counted {ugx(countedCash)} ·{" "}
            {variance === 0
              ? "Exact"
              : variance > 0
                ? `Over ${ugx(variance)}`
                : `Short ${ugx(Math.abs(variance))}`}
          </p>
          <button
            type="button"
            onClick={() => router.push("/shift/open")}
            className="min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white"
          >
            Open again
          </button>
          <button
            type="button"
            onClick={() => router.push("/pin")}
            className="mt-3 text-sm font-semibold text-kan-navy/65"
          >
            Lock till
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-8">
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
          <h1 className="text-lg font-bold">Close till</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="space-y-4 p-4">
        <section className="space-y-3 rounded-2xl border border-kan-navy/10 bg-white p-4 shadow-sm">
          <Row label="Opening float" value={ugx(breakdown.float)} />
          <Row label="Cash sales" value={ugx(breakdown.cashSales)} />
          <Row label="Cash collections" value={ugx(breakdown.collections)} />
          <Row label="Draws" value={ugx(breakdown.draws)} />
          {breakdown.expenses > 0 && (
            <Row label="Expenses" value={ugx(breakdown.expenses)} />
          )}
          <div className="rounded-xl bg-kan-navy p-3.5 text-kan-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-kan-white/70">
              Expected cash
            </p>
            <p className="ugx-amount mt-0.5 text-3xl font-bold text-kan-teal">
              {ugx(breakdown.expected)}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-kan-navy/10 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-semibold text-kan-navy">
            Counted cash (UGX)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={countedCash}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setCountedCash(parseInt(raw, 10) || 0);
            }}
            className="ugx-amount w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-3 text-center text-lg font-bold text-kan-navy outline-none focus:border-kan-navy"
          />
          <p
            className={`ugx-amount mt-2.5 text-center text-sm font-bold ${
              variance === 0
                ? "text-emerald-700"
                : variance > 0
                  ? "text-kan-navy"
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

        <section className="space-y-2 rounded-2xl border border-kan-navy/10 bg-white p-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wide text-kan-navy/60">
            Not in the box
          </h3>
          <Row label="MoMo recorded" value={ugx(breakdown.momo)} />
          <Row label="Credit sales" value={ugx(breakdown.credit)} />
        </section>

        <button
          type="button"
          onClick={() => void handleClose()}
          disabled={saving}
          className="min-h-[48px] w-full rounded-xl bg-kan-guava py-3 text-base font-bold text-kan-navy disabled:opacity-50"
        >
          {saving ? "Closing..." : "Close till"}
        </button>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-kan-navy/65">{label}</span>
      <span className="ugx-amount font-bold text-kan-navy">{value}</span>
    </div>
  );
}
