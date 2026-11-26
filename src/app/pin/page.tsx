"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/db";
import { verifyPin, shopIdForUser } from "../../lib/pin";
import { setSession, clearSession } from "../../lib/session";
import { Numpad } from "../../components/Numpad";
import { KanLogo } from "../../components/brand/KanLogo";

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

  const submitPin = async (
    value: string,
    { forceFail }: { forceFail: boolean }
  ) => {
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-kan-white">
        <KanLogo variant="navy" className="h-8 w-auto min-w-[80px]" />
        <p className="text-sm text-kan-navy/60">Loading...</p>
      </main>
    );
  }

  const locked = lockedUntil > 0;
  const remaining = locked
    ? Math.ceil((lockedUntil - Date.now()) / 1000)
    : 0;

  return (
    <main className="flex min-h-screen flex-col bg-kan-white">
      <div className="bg-kan-navy px-4 pt-8 pb-6 text-center text-kan-white">
        <KanLogo
          variant="primary"
          className="mx-auto mb-3 h-8 w-auto min-w-[80px]"
        />
        <h1 className="text-xl font-bold">{shopName}</h1>
        <p className="mt-1 text-sm text-kan-white/75">Enter attendant or owner PIN</p>
      </div>

      <div className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center p-4">
        <div className="mb-5 flex justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex h-11 w-9 items-center justify-center rounded-xl border-2 text-lg font-bold transition-colors ${
                i < pin.length
                  ? "border-kan-navy bg-kan-teal/25 text-kan-navy"
                  : "border-kan-navy/20 bg-white text-kan-navy/30"
              }`}
            >
              {i < pin.length ? "•" : ""}
            </div>
          ))}
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-kan-guava/20 px-3 py-2 text-center text-sm font-semibold text-kan-navy">
            {error}
          </p>
        )}

        {locked && (
          <p className="ugx-amount mb-3 text-center text-sm font-semibold text-kan-navy">
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
              className="text-xs font-semibold text-kan-navy/60 underline"
            >
              This is not my shop
            </button>
          ) : (
            <div className="space-y-2 rounded-xl border border-kan-guava bg-kan-guava/15 p-3">
              <p className="text-xs font-semibold text-kan-navy">
                This clears the books on this phone. Cloud data is not deleted.
              </p>
              <button
                type="button"
                onClick={() => void handleWipe()}
                className="min-h-[42px] w-full rounded-xl bg-red-600 py-2 text-sm font-bold text-white"
              >
                Clear this phone
              </button>
              <button
                type="button"
                onClick={() => setConfirmWipe(false)}
                className="text-xs font-semibold text-kan-navy/70"
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
