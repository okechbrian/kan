"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, type Shop } from "../../lib/db";
import { getCurrentUser, setSession } from "../../lib/session";
import { getDeviceToken } from "../../lib/sync";
import { ugx } from "../../lib/money";
import { generateId } from "../../lib/uuid";

interface ShopWithStats extends Shop {
  todaySales: number;
  todayCount: number;
  cash: number;
  momo: number;
  credit: number;
  shiftOpen: boolean;
}

export default function ShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<ShopWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [copyFrom, setCopyFrom] = useState("");
  const [myShopId, setMyShopId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user || user.role !== "owner") {
        router.replace("/more");
        return;
      }
      setMyShopId(user.shopId);

      const userRecord = await db.users.get(user.userId);
      if (userRecord) {
        setBusinessId(userRecord.business_id);
      }

      const localShops = await db.shops.toArray();
      const prefix = new Date().toISOString().slice(0, 10);

      const stats: ShopWithStats[] = [];
      for (const shop of localShops) {
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

        const shift = await db.shifts
          .where("[shop_id+status]")
          .equals([shop.id, "open"])
          .first();

        let cash = 0;
        let momo = 0;
        let credit = 0;
        for (const t of tenders) {
          if (t.method === "cash") cash += t.amount;
          else if (t.method === "mtn_momo" || t.method === "airtel_money")
            momo += t.amount;
          else if (t.method === "credit") credit += t.amount;
        }

        stats.push({
          ...shop,
          todaySales: sales.reduce((sum, s) => sum + s.total, 0),
          todayCount: sales.length,
          cash,
          momo,
          credit,
          shiftOpen: !!shift,
        });
      }

      setShops(stats);
      setLoading(false);
    }
    load();
  }, [router]);

  const handleAdd = async () => {
    if (saving || !newName.trim()) return;
    setSaving(true);

    try {
      const token = getDeviceToken();
      if (token) {
        const res = await fetch("/api/shops", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newName.trim(),
            copyFromShopId: copyFrom || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const { shop } = data;

          await db.shops.add({
            id: shop.id,
            business_id: businessId || "",
            name: shop.name,
            shop_code: shop.shop_code,
            momo_number: "",
            currency: "UGX",
            active: true,
            server_updated_at: new Date().toISOString(),
          });

          if (copyFrom) {
            const sourceProducts = await db.products
              .where("shop_id")
              .equals(copyFrom)
              .toArray();
            for (const p of sourceProducts) {
              await db.products.add({
                ...p,
                id: generateId(),
                shop_id: shop.id,
                stock_qty: 0,
              });
            }
          }

          setToast(`Shop created: ${shop.shop_code}`);
          setNewName("");
          setCopyFrom("");
          setShowAdd(false);

          const updated = await db.shops.toArray();
          setShops((prev) => {
            const existing = prev.map((s) => s.id);
            const newShops = updated
              .filter((s) => !existing.includes(s.id))
              .map((s) => ({
                ...s,
                todaySales: 0,
                todayCount: 0,
                cash: 0,
                momo: 0,
                credit: 0,
                shiftOpen: false,
              }));
            return [...prev, ...newShops];
          });
        } else {
          const err = await res.json();
          setToast(err.error || "Failed");
        }
      } else {
        const shopId = generateId();
        const shopCode =
          newName.trim().toUpperCase().slice(0, 4) +
          "-" +
          generateId().slice(0, 4).toUpperCase();

        await db.shops.add({
          id: shopId,
          business_id: businessId || "",
          name: newName.trim(),
          shop_code: shopCode,
          momo_number: "",
          currency: "UGX",
          active: true,
          server_updated_at: new Date().toISOString(),
        });

        if (copyFrom) {
          const sourceProducts = await db.products
            .where("shop_id")
            .equals(copyFrom)
            .toArray();
          for (const p of sourceProducts) {
            await db.products.add({
              ...p,
              id: generateId(),
              shop_id: shopId,
              stock_qty: 0,
            });
          }
        }

        setToast(`Shop created: ${shopCode}`);
        setNewName("");
        setCopyFrom("");
        setShowAdd(false);

        const updated = await db.shops.toArray();
        setShops((prev) => {
          const existing = prev.map((s) => s.id);
          const newShops = updated
            .filter((s) => !existing.includes(s.id))
            .map((s) => ({
              ...s,
              todaySales: 0,
              todayCount: 0,
              cash: 0,
              momo: 0,
              credit: 0,
              shiftOpen: false,
            }));
          return [...prev, ...newShops];
        });
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const handleSwitch = async (shop: ShopWithStats) => {
    const userId = localStorage.getItem("duuka_user_id");
    if (userId) {
      await setSession(userId, shop.id);
      router.push("/sell");
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
          <h1 className="text-lg font-bold">Shops</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="text-blue-600 text-sm font-medium"
          >
            + Add
          </button>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading...</p>
        ) : shops.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No shops found
          </p>
        ) : (
          shops.map((shop) => (
            <div
              key={shop.id}
              className={`rounded-lg border bg-white p-4 ${
                shop.id === myShopId
                  ? "border-blue-400 ring-1 ring-blue-200"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold">{shop.name}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {shop.shop_code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Today</p>
                  <p className="font-bold">{ugx(shop.todaySales)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>
                  {shop.todayCount} sale{shop.todayCount === 1 ? "" : "s"}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    shop.shiftOpen
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {shop.shiftOpen ? "Till open" : "Till closed"}
                </span>
              </div>

              <div className="flex gap-3 text-xs text-gray-600 mb-3">
                <span>Cash {ugx(shop.cash)}</span>
                <span>MoMo {ugx(shop.momo)}</span>
                <span>Credit {ugx(shop.credit)}</span>
              </div>

              <button
                onClick={() => handleSwitch(shop)}
                className={`w-full rounded-lg py-2 text-sm font-medium ${
                  shop.id === myShopId
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-700 active:bg-gray-100"
                }`}
              >
                {shop.id === myShopId ? "Current shop" : "Switch to this shop"}
              </button>
            </div>
          ))
        )}

        {showAdd && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-end justify-center">
            <div className="bg-white rounded-t-2xl w-full max-w-md p-4 pb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Add shop</h2>
                <button
                  onClick={() => setShowAdd(false)}
                  className="text-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Shop name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />

              {shops.length > 0 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Copy products from (optional)
                  </label>
                  <select
                    value={copyFrom}
                    onChange={(e) => setCopyFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Don&apos;t copy</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={!newName.trim() || saving}
                className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold active:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create shop"}
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}
    </main>
  );
}
