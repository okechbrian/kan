import { db } from "./db";

export interface BackupData {
  version: number;
  exported_at: string;
  businesses: any[];
  shops: any[];
  users: any[];
  products: any[];
  customers: any[];
  shifts: any[];
  sales: any[];
  sale_lines: any[];
  tenders: any[];
  stock_movements: any[];
  deni_ledger: any[];
  cash_movements: any[];
}

export async function exportBackup(): Promise<BackupData> {
  const [
    businesses,
    shops,
    users,
    products,
    customers,
    shifts,
    sales,
    sale_lines,
    tenders,
    stock_movements,
    deni_ledger,
    cash_movements,
  ] = await Promise.all([
    db.businesses.toArray(),
    db.shops.toArray(),
    db.users.toArray(),
    db.products.toArray(),
    db.customers.toArray(),
    db.shifts.toArray(),
    db.sales.toArray(),
    db.sale_lines.toArray(),
    db.tenders.toArray(),
    db.stock_movements.toArray(),
    db.deni_ledger.toArray(),
    db.cash_movements.toArray(),
  ]);

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    businesses,
    shops,
    users,
    products,
    customers,
    shifts,
    sales,
    sale_lines,
    tenders,
    stock_movements,
    deni_ledger,
    cash_movements,
  };
}

export async function importBackup(data: BackupData): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.businesses,
      db.shops,
      db.users,
      db.products,
      db.customers,
      db.shifts,
      db.sales,
      db.sale_lines,
      db.tenders,
      db.stock_movements,
      db.deni_ledger,
      db.cash_movements,
    ],
    async () => {
      await db.businesses.clear();
      await db.shops.clear();
      await db.users.clear();
      await db.products.clear();
      await db.customers.clear();
      await db.shifts.clear();
      await db.sales.clear();
      await db.sale_lines.clear();
      await db.tenders.clear();
      await db.stock_movements.clear();
      await db.deni_ledger.clear();
      await db.cash_movements.clear();

      await db.businesses.bulkAdd(data.businesses);
      await db.shops.bulkAdd(data.shops);
      await db.users.bulkAdd(data.users);
      await db.products.bulkAdd(data.products);
      await db.customers.bulkAdd(data.customers);
      await db.shifts.bulkAdd(data.shifts);
      await db.sales.bulkAdd(data.sales);
      await db.sale_lines.bulkAdd(data.sale_lines);
      await db.tenders.bulkAdd(data.tenders);
      await db.stock_movements.bulkAdd(data.stock_movements);
      await db.deni_ledger.bulkAdd(data.deni_ledger);
      await db.cash_movements.bulkAdd(data.cash_movements);
    }
  );
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
