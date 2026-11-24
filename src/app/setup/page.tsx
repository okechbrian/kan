"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/db";
import { setSession } from "../../lib/session";
import { setDeviceToken } from "../../lib/sync";
import { hashPin } from "../../lib/pin";
import { generateId } from "../../lib/uuid";

type Mode = "choose" | "create" | "join";

export default function SetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shopCode, setShopCode] = useState("");

  const [createName, setCreateName] = useState("");
  const [createShop, setCreateShop] = useState("");
  const [createPin, setCreatePin] = useState("");
  const [createMomo, setCreateMomo] = useState("");

  const [joinCode, setJoinCode] = useState("");
  const [joinPin, setJoinPin] = useState("");

  const handleCreate = async () => {
    if (loading) return;
    if (!createName.trim() || !createShop.trim() || createPin.length < 4) {
      setError("Fill all fields. PIN must be 4-6 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const pinHash = await hashPin(createPin);

      const res = await fetch("/api/pair/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: createName.trim(),
          shopName: createShop.trim(),
          ownerName: createName.trim(),
          pinHash,
          momoNumber: createMomo.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 503) {
        const businessId = generateId();
        const shopId = generateId();
        const userId = generateId();
        const localShopCode =
          createShop.trim().toUpperCase().slice(0, 4) +
          "-" +
          generateId().slice(0, 4).toUpperCase();

        await db.businesses.add({
          id: businessId,
          name: createName.trim(),
          created_at: new Date().toISOString(),
          server_updated_at: new Date().toISOString(),
        });

        await db.shops.add({
          id: shopId,
          business_id: businessId,
          name: createShop.trim(),
          shop_code: localShopCode,
          momo_number: createMomo.trim(),
          currency: "UGX",
          active: true,
          server_updated_at: new Date().toISOString(),
        });

        await db.users.add({
          id: userId,
          business_id: businessId,
          shop_id: shopId,
          name: createName.trim(),
          role: "owner",
          pin_hash: pinHash,
          active: true,
          server_updated_at: new Date().toISOString(),
        });

        await setSession(userId, shopId);
        setShopCode(localShopCode);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Failed to create shop");
        return;
      }

      // Cloud configured — save server data locally
      const { business_id: serverBusinessId, shop, user, token } = data;
      const businessId = serverBusinessId || shop.id;

      await db.businesses.add({
        id: businessId,
        name: createName.trim(),
        created_at: new Date().toISOString(),
        server_updated_at: new Date().toISOString(),
      });

      await db.shops.add({
        id: shop.id,
        business_id: businessId,
        name: shop.name,
        shop_code: shop.shop_code,
        momo_number: createMomo.trim(),
        currency: "UGX",
        active: true,
        server_updated_at: new Date().toISOString(),
      });

      await db.users.add({
        id: user.id,
        business_id: businessId,
        shop_id: shop.id,
        name: user.name,
        role: user.role,
        pin_hash: pinHash,
        active: true,
        server_updated_at: new Date().toISOString(),
      });

      await setSession(user.id, shop.id);
      setDeviceToken(token);
      setShopCode(shop.shop_code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shop");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (loading) return;
    if (!joinCode.trim() || joinPin.length < 4) {
      setError("Enter shop code and PIN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const pinHash = await hashPin(joinPin);

      const res = await fetch("/api/pair/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopCode: joinCode.trim().toUpperCase(),
          pinHash,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join");
        return;
      }

      const { shop, user, token, snapshot } = data;

      // Save snapshot locally
      const businessId = shop.business_id || shop.id;
      await db.businesses.add({
        id: businessId,
        name: shop.name,
        created_at: new Date().toISOString(),
        server_updated_at: new Date().toISOString(),
      });

      await db.shops.add({
        id: shop.id,
        business_id: businessId,
        name: shop.name,
        shop_code: shop.shop_code,
        momo_number: "",
        currency: "UGX",
        active: true,
        server_updated_at: new Date().toISOString(),
      });

      await db.users.add({
        id: user.id,
        business_id: businessId,
        shop_id: shop.id,
        name: user.name,
        role: user.role,
        pin_hash: pinHash,
        active: true,
        server_updated_at: new Date().toISOString(),
      });

      if (snapshot?.products) {
        for (const p of snapshot.products) {
          await db.products.put(p);
        }
      }
      if (snapshot?.customers) {
        for (const c of snapshot.customers) {
          await db.customers.put(c);
        }
      }
      if (snapshot?.users) {
        for (const u of snapshot.users) {
          const existing = await db.users.get(u.id);
          if (!existing) {
            await db.users.put(u);
          }
        }
      }
      if (snapshot?.shifts) {
        for (const s of snapshot.shifts) {
          await db.shifts.put(s);
        }
      }
      if (snapshot?.sales) {
        for (const s of snapshot.sales) {
          await db.sales.put(s);
        }
      }
      if (snapshot?.sale_lines) {
        for (const sl of snapshot.sale_lines) {
          await db.sale_lines.put(sl);
        }
      }
      if (snapshot?.tenders) {
        for (const t of snapshot.tenders) {
          await db.tenders.put(t);
        }
      }
      if (snapshot?.stock_movements) {
        for (const sm of snapshot.stock_movements) {
          await db.stock_movements.put(sm);
        }
      }
      if (snapshot?.deni_ledger) {
        for (const dl of snapshot.deni_ledger) {
          await db.deni_ledger.put(dl);
        }
      }
      if (snapshot?.cash_movements) {
        for (const cm of snapshot.cash_movements) {
          await db.cash_movements.put(cm);
        }
      }

      await setSession(user.id, shop.id);
      setDeviceToken(token);
      router.push("/pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  if (shopCode) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <h1 className="text-xl font-bold mb-2">Shop created</h1>
          <p className="text-sm text-gray-500 mb-4">
            Share this code with other devices to join:
          </p>
          <p className="text-3xl font-bold font-mono mb-4">{shopCode}</p>
          <p className="text-xs text-gray-500 mb-4">
            This phone is the till for this shop. To watch from a laptop, open
            Duuka and join with this code.
          </p>
          <button
            onClick={() => router.push("/pin")}
            className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold active:bg-blue-700"
          >
            Continue to till
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h1 className="text-xl font-bold text-center mb-6">Duuka</h1>

        {mode === "choose" && (
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-500 mb-4">
              Set up your shop
            </p>
            <button
              onClick={() => setMode("create")}
              className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold active:bg-blue-700"
            >
              Create new shop
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full rounded-lg border border-gray-300 py-3 font-medium active:bg-gray-100"
            >
              Join existing shop
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-3">
            <h2 className="font-semibold text-center">Create shop</h2>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              value={createShop}
              onChange={(e) => setCreateShop(e.target.value)}
              placeholder="Shop name (e.g. Nateete)"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <input
              type="password"
              value={createPin}
              onChange={(e) =>
                setCreatePin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Owner PIN (4-6 digits)"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <input
              type="tel"
              value={createMomo}
              onChange={(e) => setCreateMomo(e.target.value)}
              placeholder="MoMo number (optional)"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold active:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create shop"}
            </button>
            <button
              onClick={() => { setMode("choose"); setError(""); }}
              className="w-full text-sm text-gray-500"
            >
              Back
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-3">
            <h2 className="font-semibold text-center">Join shop</h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Shop code (e.g. NATE-4K2P)"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <input
              type="password"
              value={joinPin}
              onChange={(e) =>
                setJoinPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Owner PIN"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold active:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join shop"}
            </button>
            <button
              onClick={() => { setMode("choose"); setError(""); }}
              className="w-full text-sm text-gray-500"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
