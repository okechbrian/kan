"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw, Wifi } from "lucide-react";
import { isOnline, syncNow, getDeviceToken } from "../lib/sync";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";

export function OnlinePill({ onDark = false }: { onDark?: boolean }) {
  const [online, setOnline] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("");
  const pending = useLiveQuery(() => db.outbox.filter((row) => row.synced_at === null).count(), [], 0);

  useEffect(() => {
    setOnline(isOnline());
    setHasToken(!!getDeviceToken());

    const handleOnline = () => {
      setOnline(true);
      if (getDeviceToken()) void syncNow();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (syncing || !hasToken) return;
    setSyncing(true);
    try {
      const result = await syncNow();
      if (result.failed > 0) {
        setLastSync("Sync incomplete — changes kept on this device");
      } else if (result.pushed > 0 || result.pulled > 0) {
        setLastSync(`Pushed ${result.pushed}, pulled ${result.pulled}`);
      } else if (result.failed > 0) {
        setLastSync(`${result.failed} failed`);
      } else {
        setLastSync("Up to date");
      }
      setTimeout(() => setLastSync(""), 3000);
    } catch {
      setLastSync("Sync failed");
      setTimeout(() => setLastSync(""), 3000);
    } finally {
      setSyncing(false);
    }
  };

  if (!hasToken) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          onDark
            ? "bg-white/15 text-kan-white/85"
            : "bg-kan-navy/10 text-kan-navy/70"
        }`}
      >
        <CloudOff className="h-3 w-3" />
        Offline local
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
          online
            ? "bg-kan-teal text-kan-navy"
            : "bg-kan-guava text-kan-navy"
        }`}
      >
        {online ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <CloudOff className="h-3 w-3" />
        )}
        {syncing ? "Syncing" : !online ? "Offline" : pending ? "Pending sync" : "Online"}
      </span>
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing || !online}
        className={`inline-flex min-h-[28px] items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold underline disabled:opacity-50 ${
          onDark ? "text-kan-teal" : "text-kan-navy"
        }`}
      >
        <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
        {syncing ? "Syncing..." : "Sync"}
      </button>
      {lastSync && (
        <span
          className={`text-[11px] ${
            onDark ? "text-kan-white/80" : "text-kan-navy/65"
          }`}
        >
          {lastSync}
        </span>
      )}
    </div>
  );
}
