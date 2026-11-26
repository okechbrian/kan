import { type Table } from "dexie";
import { db } from "../db";
import { getCurrentUser } from "../session";

export async function ownerContext(expectedShopId?: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") throw new Error("Unlock the till with an owner PIN first");
  if (expectedShopId && expectedShopId !== user.shopId) throw new Error("Select this shop before changing its books");
  const shop = await db.shops.get(user.shopId);
  if (!shop) throw new Error("Shop not found");
  return { ...user, businessId: shop.business_id };
}

export async function ownerRows<T extends { id: string }>(table: Table<T>, allBusiness = false): Promise<T[]> {
  const actor = await ownerContext();
  const shops = await db.shops.where("business_id").equals(actor.businessId).toArray();
  const allowedShops = new Set(allBusiness ? shops.map((s) => s.id) : [actor.shopId]);
  const name = table.name;
  const rows = await table.toArray();
  if (name === "shops") return rows.filter((row) => allowedShops.has(row.id));
  if (name === "users") return rows.filter((row: any) => row.business_id === actor.businessId && (row.shop_id === null || allowedShops.has(row.shop_id)));
  if (name === "sale_lines" || name === "tenders") {
    const sales = await db.sales.where("shop_id").anyOf(Array.from(allowedShops)).toArray();
    const ids = new Set(sales.map((s) => s.id));
    return rows.filter((row: any) => ids.has(row.sale_id));
  }
  if (name === "stock_transfers") return rows.filter((row: any) => row.business_id === actor.businessId && (allowedShops.has(row.from_shop_id) || allowedShops.has(row.to_shop_id)));
  return rows.filter((row: any) => allowedShops.has(row.shop_id));
}
