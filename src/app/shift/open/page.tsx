"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../lib/db";
import { getSession } from "../../../lib/session";
import { generateId } from "../../../lib/uuid";
import { ugx } from "../../../lib/money";

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xs">
        <h1 className="text-xl font-bold text-center mb-1">Open till</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Cash you put in the box for change
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opening float
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          {parsed > 0 && (
            <p className="text-sm text-gray-500 text-center mt-1">
              {ugx(parsed)}
            </p>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleOpen}
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 py-3 text-white text-lg font-semibold active:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Opening..." : "Open till"}
        </button>
      </div>
    </main>
  );
}
