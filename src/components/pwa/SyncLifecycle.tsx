"use client";
import { useEffect } from "react";
import { liveQuery } from "dexie";
import { db } from "../../lib/db";
import { getDeviceToken, isOnline, syncNow } from "../../lib/sync";

/** Outbox persistence is synchronous with local writes; network work starts afterwards. */
export function SyncLifecycle() {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let retryMs = 1000;
    async function run() {
      if (stopped || !getDeviceToken() || !isOnline()) return;
      const result = await syncNow();
      if (stopped) return;
      if (result.failed) { retryMs = Math.min(retryMs * 2, 60000); timer = setTimeout(run, retryMs); }
      else {
        retryMs = 1000;
        if (await db.outbox.filter((row) => row.synced_at === null).count()) timer = setTimeout(run, 250);
      }
    }
    function schedule() { clearTimeout(timer); if (document.visibilityState === "visible") timer = setTimeout(run, 250); }
    const subscription = liveQuery(() => db.outbox.filter((item) => item.synced_at === null).count()).subscribe({ next: (count) => { if (count) schedule(); } });
    window.addEventListener("online", schedule);
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => { stopped = true; clearTimeout(timer); subscription.unsubscribe(); window.removeEventListener("online", schedule); document.removeEventListener("visibilitychange", schedule); };
  }, []);
  return null;
}
