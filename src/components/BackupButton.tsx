"use client";

import { useState } from "react";
import { exportBackup, downloadBackup, uploadBackup, importBackup } from "../lib/backup";

export function BackupButton({ canRestore = true }: { canRestore?: boolean }) {
  const [status, setStatus] = useState<"idle" | "exporting" | "importing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setStatus("exporting");
      setError(null);
      const data = await exportBackup();
      downloadBackup(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const handleImport = async () => {
    try {
      setStatus("importing");
      setError(null);
      const data = await uploadBackup();
      await importBackup(data);
      setStatus("idle");
      window.location.reload();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Import failed");
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={status === "exporting"}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        {status === "exporting" ? "Exporting..." : "Download backup"}
      </button>
      {canRestore && (
      <button
        onClick={handleImport}
        disabled={status === "importing"}
        className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded disabled:opacity-50"
      >
        {status === "importing" ? "Importing..." : "Restore backup"}
      </button>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
