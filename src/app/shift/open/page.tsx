"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/db";
import { getSession } from "../../../lib/session";
import { generateId } from "../../../lib/uuid";
import { ugx } from "../../../lib/money";
import { KanLogo } from "../../../components/brand/KanLogo";

export default function ShiftOpenPage() {
  const router = useRouter();
  const [float, setFloat] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const parsed = parseInt(float.replace(/[^0-9]/g, ""), 10) || 0;

  const handleOpen = async () => {
    const session = getSession();
    if (!session) {
      router.push("/pin");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const shiftId = generateId();
      await db.shifts.add({
        id: shiftId,
        shop_id: session.shopId,
        user_id: session.userId,
        opened_at: new Date().toISOString(),
        closed_at: null,
        opening_float: parsed,
        counted_cash: null,
        expected_cash: null,
        variance: null,
        status: "open",
      });
      router.push("/sell");
    } catch {
      setError("Failed to open shift");
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-kan-navy p-4">
      <div className="w-full max-w-xs rounded-2xl bg-kan-white p-6 shadow-xl">
        <KanLogo
          variant="navy"
          className="mx-auto mb-3 h-7 w-auto min-w-[80px]"
        />
        <h1 className="mb-1 text-center text-xl font-bold text-kan-navy">
          Open till
        </h1>
        <p className="mb-6 text-center text-sm text-kan-navy/65">
          Cash you put in the box for change
        </p>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-kan-navy">
            Opening float (UGX)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={float}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setFloat(raw);
            }}
            placeholder="0"
            className="ugx-amount w-full rounded-xl border border-kan-navy/20 bg-white px-4 py-3 text-center text-lg font-bold text-kan-navy outline-none focus:border-kan-navy"
          />
          {parsed > 0 && (
            <p className="ugx-amount mt-1.5 text-center text-sm font-semibold text-kan-navy/70">
              {ugx(parsed)}
            </p>
          )}
        </div>

        {error && (
          <p className="mb-3 text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleOpen}
          disabled={saving}
          className="min-h-[48px] w-full rounded-xl bg-kan-navy py-3 text-base font-bold text-kan-white active:opacity-90 disabled:opacity-50"
        >
          {saving ? "Opening..." : "Open till"}
        </button>
      </div>
    </main>
  );
}
