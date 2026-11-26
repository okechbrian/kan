"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { ownerContext } from "../lib/dashboard/access";
import {
  exportBackup,
  downloadBackup,
  uploadBackup,
  importBackup,
} from "../lib/backup";

export function BackupButton({ canRestore = true }: { canRestore?: boolean }) {
  const [status, setStatus] = useState<
    "idle" | "exporting" | "importing" | "error"
  >("idle");
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
      await ownerContext();
      const data = await uploadBackup();
      await ownerContext();
      await importBackup(data);
      setStatus("idle");
      window.location.reload();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Import failed");
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-kan-navy/10 bg-white p-3.5">
      <p className="text-xs font-medium text-kan-navy/65">
        Clearing browser data deletes local shop books until synced or backed up.
      </p>
      <button
        type="button"
        onClick={handleExport}
        disabled={status === "exporting"}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-kan-navy px-4 py-2.5 text-sm font-bold text-kan-white disabled:opacity-50"
      >
        <Download className="h-4 w-4 text-kan-teal" />
        {status === "exporting" ? "Exporting..." : "Download backup"}
      </button>
      {canRestore && (
        <button
          type="button"
          onClick={handleImport}
          disabled={status === "importing"}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-kan-navy/20 bg-kan-white px-4 py-2.5 text-sm font-bold text-kan-navy disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {status === "importing" ? "Importing..." : "Restore backup"}
        </button>
      )}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
