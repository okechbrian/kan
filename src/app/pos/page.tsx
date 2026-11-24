"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../lib/db";
import { getSession } from "../../lib/session";

// This is the former `/` entry point. Marketing now lives at `/`.
export default function PosEntry() {
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const session = getSession();
      if (!session) {
        router.replace("/pin");
        return;
      }
      const shops = await db.shops.toArray();
      const isOwner = localStorage.getItem("duuka_role") === "owner";
      if (isOwner && shops.length >= 2) {
        router.replace("/home");
        return;
      }
      const openShift = await db.shifts
        .where("[shop_id+status]")
        .equals([session.shopId, "open"])
        .first();
      if (openShift) {
        router.replace("/sell");
      } else {
        router.replace("/shift/open");
      }
    }
    load();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream">
      <p className="text-sm text-gray-500">Opening the till…</p>
    </main>
  );
}
