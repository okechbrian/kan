"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, type Shop } from "../../lib/db";
import { getCurrentUser } from "../../lib/session";
import { generateId } from "../../lib/uuid";

export default function SettingsPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [reorderLevel, setReorderLevel] = useState(5);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user || user.role !== "owner") {
        router.replace("/more");
        return;
      }
      const s = await db.shops.get(user.shopId);
      if (s) {
        setShop(s);
        setName(s.name);
        setMomoNumber(s.momo_number);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleSave = async () => {
    if (!shop || saving) return;
    if (!name.trim()) return;

    setSaving(true);
    try {
      await db.shops.where("id").equals(shop.id).modify((s) => {
        s.name = name.trim();
        s.momo_number = momoNumber.trim();
      });
      setToast("Saved");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!shop || saving) return;
    const newCode = generateId().slice(0, 8).toUpperCase();
    await db.shops.where("id").equals(shop.id).modify((s) => {
      s.shop_code = newCode;
    });
    setShop({ ...shop, shop_code: newCode });
    setToast("Code regenerated");
    setTimeout(() => setToast(""), 2000);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!shop) return null;

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
          <h1 className="text-lg font-bold">Shop settings</h1>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="text-blue-600 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shop name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MoMo number
          </label>
          <input
            type="tel"
            value={momoNumber}
            onChange={(e) => setMomoNumber(e.target.value)}
            placeholder="07xxxxxxxx"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Low stock alert level
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={reorderLevel}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              setReorderLevel(parseInt(raw, 10) || 0);
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Products at or below this qty show as low stock
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Shop code</p>
          <p className="text-lg font-bold font-mono mt-1">{shop.shop_code}</p>
          <button
            onClick={handleRegenerateCode}
            className="mt-2 text-xs text-red-600 underline"
          >
            Regenerate code
          </button>
        </div>

        <button
          onClick={() => router.push("/settings/users")}
          className="w-full rounded-lg bg-white border border-gray-200 px-4 py-3 text-left font-medium active:bg-gray-100"
        >
          Users & PINs
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
