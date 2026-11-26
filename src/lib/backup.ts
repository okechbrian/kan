import { db } from "./db";
import { BACKUP_TABLES } from "./backup-tables";
import { clearDeviceToken } from "./sync";

export type BackupData = { version: number; exported_at: string } & Record<(typeof BACKUP_TABLES)[number], any[]>;
const LEGACY_TABLES = BACKUP_TABLES.slice(0, 12);
const INTEGER_FIELD = /^(amount|amount_tendered|change|balance|total|subtotal|delivery_fee|selling_price|buying_price|unit_price|unit_cost|line_total|buying_price_snapshot|opening_float|counted_cash|expected_cash|variance|paid|deposit_ugx|cost_ugx|qty|qty_delta|stock_qty|quantity|qty_produced)$/;
function validateIntegers(value: unknown) {
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (nested !== null && INTEGER_FIELD.test(key) && !Number.isSafeInteger(nested)) throw new Error("Invalid integer in backup");
    validateIntegers(nested);
  }
}

export async function exportBackup(): Promise<BackupData> {
  return db.transaction("r", BACKUP_TABLES.map((name) => db.table(name)), async () => {
    const data: any = { version: 2, exported_at: new Date().toISOString() };
    for (const name of BACKUP_TABLES) data[name] = await db.table(name).toArray();
    return data as BackupData;
  });
}

export function validateBackup(input: unknown): BackupData {
  if (!input || typeof input !== "object") throw new Error("Invalid backup");
  const source = input as Record<string, any>;
  if (source.version !== 1 && source.version !== 2) throw new Error("Unsupported backup version");
  const data: any = { version: 2, exported_at: source.exported_at };
  for (const name of BACKUP_TABLES) {
    const rows = source[name] ?? (source.version === 1 && !LEGACY_TABLES.includes(name) ? [] : null);
    if (!Array.isArray(rows)) throw new Error(`Missing backup table: ${name}`);
    const ids = new Set<string>();
    for (const row of rows) {
      if (!row || typeof row !== "object" || typeof row.id !== "string" || !row.id || ids.has(row.id)) throw new Error(`Invalid backup row: ${name}`);
      ids.add(row.id);
      validateIntegers(row);
    }
    data[name] = rows;
  }
  const ids = (name: string) => new Set(data[name].map((row: any) => row.id));
  const shops = ids("shops"), businesses = ids("businesses"), sales = ids("sales"), products = ids("products");
  for (const row of data.shops) if (!businesses.has(row.business_id)) throw new Error("Unknown backup business");
  for (const name of BACKUP_TABLES) for (const row of data[name]) {
    if (row.shop_id && !shops.has(row.shop_id)) throw new Error("Unknown backup shop");
    if (["sale_lines", "tenders"].includes(name) && !sales.has(row.sale_id)) throw new Error("Unknown backup sale");
    if (["sale_lines", "stock_movements", "batches"].includes(name) && !products.has(row.product_id)) throw new Error("Unknown backup product");
  }
  return data as BackupData;
}

export async function importBackup(input: unknown): Promise<void> {
  const data = validateBackup(input); // Validate before clearing ANY existing books.
  await db.transaction("rw", [...BACKUP_TABLES.map((name) => db.table(name)), db.outbox, db.devices], async () => {
    await db.outbox.clear();
    await db.devices.clear();
    for (const name of BACKUP_TABLES) {
      await db.table(name).clear();
      await db.table(name).bulkAdd(data[name]);
    }
    // A whole backup may contain weeks of sales. Preserve each sale's atomic
    // cohort, rather than trying to send the entire restore in one HTTP batch.
    await db.outbox.toCollection().modify((entry) => {
      const row = JSON.parse(entry.payload);
      const saleId = entry.table === "sales" ? row.id
        : ["sale_lines", "tenders", "deni_ledger"].includes(entry.table) ? row.sale_id
        : entry.table === "stock_movements" && ["sale", "void"].includes(row.type) ? row.ref_id : null;
      entry.batch_id = saleId ? `restored-sale:${saleId}` : `restored-event:${row.created_at ?? row.incurred_at ?? row.id}:${row.user_id ?? ""}`;
    });
  });
  // A backup must never retain another shop's cloud identity or cursor.
  if (typeof window !== "undefined") {
    clearDeviceToken();
    localStorage.removeItem("duuka_paired_shop_id");
  }
}

export function downloadBackup(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `duuka-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function uploadBackup(): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }
      try {
        const text = await file.text();
        const data = JSON.parse(text) as BackupData;
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}
