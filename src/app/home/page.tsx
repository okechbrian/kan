"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, type Shop } from "../../lib/db";
import { getCurrentUser, setSession } from "../../lib/session";
import { ugx } from "../../lib/money";

interface ShopStats {
  shop: Shop;
  todaySales: number;
  todayCount: number;
  cash: number;
  momo: number;
  credit: number;
}

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<ShopStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user || user.role !== "owner") {
        router.replace("/sell");
        return;
      }
      setCurrentShopId(user.shopId);

      const shops = await db.shops.toArray();
      const prefix = new Date().toISOString().slice(0, 10);
      const result: ShopStats[] = [];

      for (const shop of shops) {
        const sales = await db.sales
          .where("shop_id")
          .equals(shop.id)
          .filter(
            (s) =>
              s.status === "completed" && s.created_at.startsWith(prefix)
          )
          .toArray();

        const saleIds = sales.map((s) => s.id);
        const tenders = await db.tenders
          .where("sale_id")
          .anyOf(saleIds)
          .toArray();

        let cash = 0;
        let momo = 0;
        let credit = 0;
        for (const t of tenders) {
          if (t.method === "cash") cash += t.amount;
          else if (t.method === "mtn_momo" || t.method === "airtel_money")
            momo += t.amount;
          else if (t.method === "credit") credit += t.amount;
        }

        result.push({
          shop,
          todaySales: sales.reduce((sum, s) => sum + s.total, 0),
          todayCount: sales.length,
          cash,
          momo,
          credit,
        });
      }

      setStats(result);
      setLoading(false);
    }
    load();
  }, [router]);

  const handleEnter = async (shopId: string) => {
    const userId = localStorage.getItem("duuka_user_id");
    if (userId) {
      await setSession(userId, shopId);
      router.push("/sell");
    }
  };

  const grandTotal = stats.reduce((sum, s) => sum + s.todaySales, 0);
  const grandCount = stats.reduce((sum, s) => sum + s.todayCount, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-bold text-center">My Duukas</h1>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : stats.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-gray-500">No shops yet</p>
            <button
              onClick={() => router.push("/shops")}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-white font-semibold"
            >
              Add your first shop
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Today&apos;s total</p>
              <p className="text-3xl font-bold">{ugx(grandTotal)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {grandCount} sale{grandCount === 1 ? "" : "s"} across{" "}
                {stats.length} shop{stats.length === 1 ? "" : "s"}
              </p>
            </div>

            {stats.map((s) => (
              <div
                key={s.shop.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold">{s.shop.name}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {s.shop.shop_code}
                    </p>
                  </div>
                  <p className="text-xl font-bold">{ugx(s.todaySales)}</p>
                </div>

                <div className="flex gap-3 text-xs text-gray-600 mb-3">
                  <span>{s.todayCount} sale{s.todayCount === 1 ? "" : "s"}</span>
                  <span>Cash {ugx(s.cash)}</span>
                  <span>MoMo {ugx(s.momo)}</span>
                  {s.credit > 0 && <span>Credit {ugx(s.credit)}</span>}
                </div>

                <button
                  onClick={() => handleEnter(s.shop.id)}
                  className={`w-full rounded-lg py-2.5 text-sm font-medium ${
                    s.shop.id === currentShopId
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-700 active:bg-gray-100"
                  }`}
                >
                  {s.shop.id === currentShopId
                    ? "Current"
                    : "Enter this shop"}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
