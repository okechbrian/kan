"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
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
    <main className="mx-auto min-h-screen max-w-[420px] bg-kan-white pb-20">
      <header className="sticky top-0 z-20 bg-kan-navy px-4 py-3 text-kan-white shadow-sm">
        <h1 className="text-lg font-bold">More</h1>
      </header>
      <div className="space-y-4 p-4">
        {/* Today summary */}
        <section className="rounded-2xl bg-kan-navy p-5 text-kan-white shadow-md">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-kan-white/70">
            Today
          </h2>
          <p className="ugx-amount text-3xl font-bold text-kan-teal">
            {ugx(salesTotal)}
          </p>
          <p className="mt-1 text-xs text-kan-white/75">
            {salesCount} sale{salesCount === 1 ? "" : "s"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/15 pt-3 text-xs">
            <div>
              <span className="text-kan-white/65">Cash</span>
              <p className="ugx-amount font-bold">{ugx(byMethod.cash)}</p>
            </div>
            <div>
              <span className="text-kan-white/65">MTN MoMo</span>
              <p className="ugx-amount font-bold">{ugx(byMethod.mtn_momo)}</p>
            </div>
            <div>
              <span className="text-kan-white/65">Airtel Money</span>
              <p className="ugx-amount font-bold">
                {ugx(byMethod.airtel_money)}
              </p>
            </div>
            <div>
              <span className="text-kan-white/65">Credit (Deni)</span>
              <p className="ugx-amount font-bold text-kan-guava">
                {ugx(byMethod.credit)}
              </p>
            </div>
          </div>
        </section>

        {/* Profit estimate (owner only) */}
        {isOwner && (
          <section className="rounded-2xl border border-kan-navy/10 bg-white p-4 shadow-sm">
            <h2 className="mb-1 text-xs font-bold uppercase tracking-wide text-kan-navy/60">
              Profit estimate
            </h2>
            <p className="ugx-amount text-2xl font-bold text-kan-navy">
              {ugx(profitEstimate)}
            </p>
            <p className="mt-1 text-xs text-kan-navy/60">
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
            label="Today's sales & receipts"
            onClick={() => router.push("/more/sales")}
          />
          <MenuItem
            label="Who owes (Deni)"
            onClick={() => router.push("/customers")}
          />
          <MenuItem
            label="Payments"
            onClick={() => router.push("/more/payments")}
          />
          {isOwner && (
            <>
              <MenuItem
                label="Web dashboard"
                onClick={() => router.push("/app/dashboard")}
              />
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

        <div className="space-y-2">
          <MenuItem
            label="Install Kan"
            onClick={() => router.push("/more/install")}
          />
          <MenuItem
            label="Hardware"
            onClick={() => router.push("/more/hardware")}
          />
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
                void db.shops.toArray().then((shops) => {
                  if (shops.length > 0) {
                    alert(`Share this code:\n${shops[0].shop_code}`);
                  }
                });
              }}
            />
          )}
        </div>

        <button
          type="button"
          onClick={handleLock}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-kan-navy/20 bg-white px-4 py-3 font-bold text-kan-navy active:bg-kan-navy/5"
        >
          <Lock className="h-4 w-4" />
          Lock till
        </button>
      </div>
      <BottomNav />
    </main>
  );
}

function MenuItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-kan-navy/10 bg-white px-4 py-3 text-left text-sm font-semibold text-kan-navy active:bg-kan-teal/10"
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-kan-navy/40" />
    </button>
  );
}
