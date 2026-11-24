"use client";

import { useEffect, useState } from "react";
import { isOnline, syncNow, getDeviceToken } from "../lib/sync";

export function OnlinePill() {
  const [online, setOnline] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("");

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
      if (result.pushed > 0 || result.pulled > 0) {
        setLastSync(
          `Pushed ${result.pushed}, pulled ${result.pulled}`
        );
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
      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
        Cloud not configured
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          online
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {syncing ? "Syncing" : online ? "Synced" : "Offline"}
      </span>
      <button
        onClick={handleSync}
        disabled={syncing || !online}
        className="text-xs text-blue-600 underline disabled:opacity-50"
      >
        {syncing ? "Syncing..." : "Sync"}
      </button>
      {lastSync && (
        <span className="text-xs text-gray-500">{lastSync}</span>
      )}
    </div>
  );
}
