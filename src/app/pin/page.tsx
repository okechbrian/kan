"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/db";
import { verifyPin, shopIdForUser } from "../../lib/pin";
import { setSession, clearSession } from "../../lib/session";
import { Numpad } from "../../components/Numpad";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;

export default function PinPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    async function load() {
      const shops = await db.shops.toArray();
      if (shops.length === 0) {
        router.replace("/");
        return;
      }
      setShopName(shops[0].name);
      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    if (lockedUntil === 0) return;
    const timer = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(0);
        setAttempts(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const failPin = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPin("");
    if (nextAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_MS);
      setError("Too many attempts. Wait 30 seconds.");
    } else {
      setError(`Wrong PIN. ${MAX_ATTEMPTS - nextAttempts} tries left.`);
    }
  };

  const submitPin = async (value: string, { forceFail }: { forceFail: boolean }) => {
    if (lockedUntil > 0) return;
    if (value.length < 4 || value.length > 6) return;

    const users = await db.users.filter((u) => u.active).toArray();
    for (const user of users) {
      if (await verifyPin(value, user.pin_hash)) {
        const shopId = await shopIdForUser(user);
        if (!shopId) {
          setPin("");
          setError("No shop on this device.");
          return;
        }
        await setSession(user.id, shopId);
        const openShift = await db.shifts
          .where("[shop_id+status]")
          .equals([shopId, "open"])
          .first();
        if (openShift) {
          router.push("/sell");
        } else {
          router.push("/shift/open");
        }
        return;
      }
    }

    if (forceFail || value.length === 6) {
      failPin();
    }
  };

  const handlePress = (digit: string) => {
    if (lockedUntil > 0) return;
    setError("");
    setPin((prev) => {
      if (prev.length >= 6) return prev;
      const next = prev + digit;
      if (next.length >= 4) {
        void submitPin(next, { forceFail: false });
      }
      return next;
    });
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const handleWipe = async () => {
    clearSession();
    await db.delete();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  const locked = lockedUntil > 0;
  const remaining = locked
    ? Math.ceil((lockedUntil - Date.now()) / 1000)
    : 0;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xs">
        <h1 className="text-xl font-bold text-center mb-1">{shopName}</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Enter PIN</p>

        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-10 rounded border-2 flex items-center justify-center text-lg font-bold ${
                i < pin.length
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300"
              }`}
            >
              {i < pin.length ? "•" : ""}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center mb-3">{error}</p>
        )}

        {locked && (
          <p className="text-orange-600 text-sm text-center mb-3">
            Wait {remaining}s
          </p>
        )}

        <Numpad
          onPress={handlePress}
          onDelete={handleDelete}
          onConfirm={() => void submitPin(pin, { forceFail: true })}
        />

        <div className="mt-6 text-center">
          {!confirmWipe ? (
            <button
              type="button"
              onClick={() => setConfirmWipe(true)}
              className="text-sm text-gray-500 underline"
            >
              This is not my shop
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-red-600">
                This clears the books on this phone. Cloud data is not deleted.
              </p>
              <button
                type="button"
                onClick={() => void handleWipe()}
                className="w-full rounded-lg bg-red-600 py-2 text-white font-medium"
              >
                Clear this phone
              </button>
              <button
                type="button"
                onClick={() => setConfirmWipe(false)}
                className="text-sm text-gray-500"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
