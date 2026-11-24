"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/db";
import { getCurrentUser, clearSession } from "../../lib/session";
import { ugx } from "../../lib/money";
import { BottomNav } from "../../components/BottomNav";
import { BackupButton } from "../../components/BackupButton";

function todayPrefix(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function MorePage() {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [hasOpenShift, setHasOpenShift] = useState(false);

  const [salesTotal, setSalesTotal] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [byMethod, setByMethod] = useState({
    cash: 0,
    mtn_momo: 0,
    airtel_money: 0,
    credit: 0,
  });
  const [profitEstimate, setProfitEstimate] = useState(0);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/pin");
        return;
      }
      setIsOwner(user.role === "owner");

      const openShift = await db.shifts
        .where("[shop_id+status]")
        .equals([user.shopId, "open"])
        .first();
      setHasOpenShift(!!openShift);

      const prefix = todayPrefix();
      const sales = await db.sales
        .where("shop_id")
        .equals(user.shopId)
        .filter(
          (s) => s.status === "completed" && s.created_at.startsWith(prefix)
        )
        .toArray();
      setSalesCount(sales.length);
      setSalesTotal(sales.reduce((sum, s) => sum + s.total, 0));

      const saleIds = new Set(sales.map((s) => s.id));
      const tenders = await db.tenders.toArray();
      const next = { cash: 0, mtn_momo: 0, airtel_money: 0, credit: 0 };
      for (const t of tenders) {
        if (!saleIds.has(t.sale_id)) continue;
        next[t.method] += t.amount;
      }
      setByMethod(next);

      const saleLines = await db.sale_lines.toArray();
      let profit = 0;
      for (const line of saleLines) {
        if (!saleIds.has(line.sale_id)) continue;
        profit += (line.unit_price - line.buying_price_snapshot) * line.qty;
      }
      setProfitEstimate(profit);
    }
    load();
  }, [router]);

  const handleLock = () => {
    clearSession();
    router.push("/pin");
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20 mx-auto max-w-[420px]">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-bold">More</h1>
      </header>
      <div className="p-4 space-y-4">
        {/* Today summary */}
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Today
          </h2>
          <p className="text-3xl font-bold">{ugx(salesTotal)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {salesCount} sale{salesCount === 1 ? "" : "s"}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-gray-600">
            <li>Cash {ugx(byMethod.cash)}</li>
            <li>MTN {ugx(byMethod.mtn_momo)}</li>
            <li>Airtel {ugx(byMethod.airtel_money)}</li>
            <li>Credit {ugx(byMethod.credit)}</li>
          </ul>
        </section>

        {/* Profit estimate (owner only) */}
        {isOwner && (
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-1">
              Profit estimate
            </h2>
            <p className="text-2xl font-bold">{ugx(profitEstimate)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Estimate (last cost). Not net profit — overheads like rent,
              transport, and staff are not included.
            </p>
          </section>
        )}

        {/* Menu */}
        <div className="space-y-2">
          {hasOpenShift && (
            <MenuItem
              label="Close till"
              onClick={() => router.push("/shift/close")}
            />
          )}
          <MenuItem
            label="Today's sales"
            onClick={() => router.push("/more/sales")}
          />
          <MenuItem
            label="Who owes"
            onClick={() => router.push("/customers")}
          />
          {isOwner && (
            <>
              <MenuItem
                label="Owner draw"
                onClick={() => router.push("/more/draw")}
              />
              <MenuItem
                label="Products"
                onClick={() => router.push("/stock")}
              />
              <MenuItem
                label="Receive goods"
                onClick={() => router.push("/stock/receive")}
              />
              <MenuItem
                label="Users & PINs"
                onClick={() => router.push("/settings/users")}
              />
              <MenuItem
                label="Shop settings"
                onClick={() => router.push("/settings")}
              />
              <MenuItem
                label="Shops"
                onClick={() => router.push("/shops")}
              />
            </>
          )}
        </div>

        <BackupButton canRestore={isOwner} />

        <MenuItem
          label="Sync now"
          onClick={() => {
            void import("../../lib/sync").then((s) => s.syncNow());
          }}
        />

        {isOwner && (
          <MenuItem
            label="Pair another device"
            onClick={() => {
              const shop = db.shops.toArray().then((shops) => {
                if (shops.length > 0) {
                  alert(`Share this code:\n${shops[0].shop_code}`);
                }
              });
            }}
          />
        )}

        <button
          onClick={handleLock}
          className="w-full rounded-lg bg-white border border-gray-200 px-4 py-3 text-left font-medium active:bg-gray-100"
        >
          Lock
        </button>
      </div>
      <BottomNav />
    </main>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg bg-white border border-gray-200 px-4 py-3 text-left font-medium active:bg-gray-100"
    >
      {label}
    </button>
  );
}
