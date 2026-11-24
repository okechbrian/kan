import { db, type OutboxItem } from "./db";
import { generateId } from "./uuid";

const SYNC_API = "/api/sync";
const DEVICE_TOKEN_KEY = "duuka_device_token";
const SYNC_CURSOR_KEY = "duuka_sync_cursor";

export function getDeviceToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEVICE_TOKEN_KEY);
}

export function setDeviceToken(token: string): void {
  localStorage.setItem(DEVICE_TOKEN_KEY, token);
}

export function clearDeviceToken(): void {
  localStorage.removeItem(DEVICE_TOKEN_KEY);
  localStorage.removeItem(SYNC_CURSOR_KEY);
}

export function getSyncCursor(): string {
  if (typeof window === "undefined") return "0";
  return localStorage.getItem(SYNC_CURSOR_KEY) || "0";
}

export function setSyncCursor(cursor: string): void {
  localStorage.setItem(SYNC_CURSOR_KEY, cursor);
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export async function addToOutbox(
  table: string,
  rowId: string,
  op: "insert" | "update" | "void",
  payload: unknown
): Promise<void> {
  await db.outbox.add({
    id: generateId(),
    table,
    row_id: rowId,
    op,
    payload: JSON.stringify(payload),
    created_at: new Date().toISOString(),
    synced_at: null,
  });
}

/** Write outbox then try sync. Never throws — Charge must not wait on the network. */
export async function queueAndMaybeSync(
  items: {
    table: string;
    row_id: string;
    op: "insert" | "update" | "void";
    payload: unknown;
  }[]
): Promise<void> {
  try {
    for (const item of items) {
      await addToOutbox(item.table, item.row_id, item.op, item.payload);
    }
    if (getDeviceToken() && isOnline()) {
      void syncNow();
    }
  } catch {
    // local sale already committed
  }
}

export async function pushOutbox(): Promise<{ pushed: number; failed: number }> {
  const token = getDeviceToken();
  if (!token) return { pushed: 0, failed: 0 };

  const pending = await db.outbox
    .filter((item) => item.synced_at === null)
    .sortBy("created_at");

  if (pending.length === 0) return { pushed: 0, failed: 0 };

  try {
    const res = await fetch(SYNC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mutations: pending.map((item) => ({
          table: item.table,
          row_id: item.row_id,
          op: item.op,
          payload: JSON.parse(item.payload),
        })),
      }),
    });

    if (!res.ok) {
      return { pushed: 0, failed: pending.length };
    }

    const now = new Date().toISOString();
    for (const item of pending) {
      await db.outbox
        .where("id")
        .equals(item.id)
        .modify((o) => {
          o.synced_at = now;
        });
    }
    return { pushed: pending.length, failed: 0 };
  } catch {
    return { pushed: 0, failed: pending.length };
  }
}

export async function pullSync(): Promise<{
  pulled: number;
  cursor: string;
} | null> {
  const token = getDeviceToken();
  if (!token) return null;

  const cursor = getSyncCursor();

  try {
    const res = await fetch(`${SYNC_API}?since=${cursor}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const { rows, new_cursor } = data;

    if (!rows || typeof new_cursor === "undefined") return null;

    let pulled = 0;

    for (const [table, tableRows] of Object.entries(rows) as [string, Record<string, unknown>[]][]) {
      for (const row of tableRows) {
        const id = row.id as string;
        if (!id) continue;

        const dbAny = db as unknown as Record<string, unknown>;
        const dexieTable = dbAny[table];
        if (
          !dexieTable ||
          typeof (dexieTable as { add?: unknown }).add !== "function"
        ) {
          continue;
        }

        try {
          const incoming = { ...row };
          if (table === "products") {
            delete incoming.stock_qty;
          }
          const existing = await (
            dexieTable as { get: (id: string) => Promise<unknown> }
          ).get(id);
          if (existing && table === "products") {
            await (
              dexieTable as { put: (row: unknown) => Promise<unknown> }
            ).put({ ...(existing as object), ...incoming });
          } else if (existing) {
            await (
              dexieTable as { put: (row: unknown) => Promise<unknown> }
            ).put(incoming);
          } else {
            await (
              dexieTable as { add: (row: unknown) => Promise<unknown> }
            ).add(incoming);
          }
          pulled++;
        } catch {
          // skip
        }
      }
    }

    const products = await db.products.toArray();
    for (const p of products) {
      const qty = await recomputeStockQty(p.id);
      await db.products
        .where("id")
        .equals(p.id)
        .modify((row) => {
          row.stock_qty = qty;
        });
    }

    setSyncCursor(String(new_cursor));
    return { pulled, cursor: String(new_cursor) };
  } catch {
    return null;
  }
}

export async function syncNow(): Promise<{
  pushed: number;
  pulled: number;
  failed: number;
}> {
  if (!isOnline()) return { pushed: 0, pulled: 0, failed: 0 };

  const pushResult = await pushOutbox();
  const pullResult = await pullSync();

  return {
    pushed: pushResult.pushed,
    pulled: pullResult?.pulled ?? 0,
    failed: pushResult.failed,
  };
}

export function recomputeStockQty(productId: string): Promise<number> {
  return db.stock_movements
    .where("product_id")
    .equals(productId)
    .toArray()
    .then((movements) => {
      const total = movements.reduce((sum, m) => sum + m.qty_delta, 0);
      return total;
    });
}
