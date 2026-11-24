import { db, type Business, type Shop, type User, type Product, type StockMovement } from "./db";
import { generateId } from "./uuid";
import { hashPin } from "./pin";

const DEMO_BUSINESS_ID = "business-demo-001";
const DEMO_SHOP_ID = "shop-demo-001";
const DEMO_OWNER_ID = "user-demo-owner-001";

export async function seedDemoData(): Promise<void> {
  const businessCount = await db.businesses.count();
  if (businessCount > 0) {
    return;
  }

  const business: Business = {
    id: DEMO_BUSINESS_ID,
    name: "Demo Business",
    created_at: new Date().toISOString(),
    server_updated_at: new Date().toISOString(),
  };

  const shop: Shop = {
    id: DEMO_SHOP_ID,
    business_id: DEMO_BUSINESS_ID,
    name: "Demo Duuka",
    shop_code: "DUKA-DEMO",
    momo_number: "0700000000",
    currency: "UGX",
    active: true,
    server_updated_at: new Date().toISOString(),
  };

  const owner: User = {
    id: DEMO_OWNER_ID,
    business_id: DEMO_BUSINESS_ID,
    shop_id: null,
    name: "Owner",
    role: "owner",
    pin_hash: await hashPin("1234"),
    active: true,
    server_updated_at: new Date().toISOString(),
  };

  const now = new Date().toISOString();
  const products: Product[] = [
    {
      id: generateId(),
      shop_id: DEMO_SHOP_ID,
      name: "Sugar 1kg",
      unit: "kg",
      sku_code: "",
      selling_price: 5000,
      buying_price: 4200,
      stock_qty: 20,
      is_fast_mover: true,
      photo_url: "",
      active: true,
      server_updated_at: now,
    },
    {
      id: generateId(),
      shop_id: DEMO_SHOP_ID,
      name: "Cooking oil 1L",
      unit: "l",
      sku_code: "",
      selling_price: 9000,
      buying_price: 7500,
      stock_qty: 12,
      is_fast_mover: true,
      photo_url: "",
      active: true,
      server_updated_at: now,
    },
    {
      id: generateId(),
      shop_id: DEMO_SHOP_ID,
      name: "Bar soap",
      unit: "pc",
      sku_code: "",
      selling_price: 3500,
      buying_price: 2500,
      stock_qty: 24,
      is_fast_mover: true,
      photo_url: "",
      active: true,
      server_updated_at: now,
    },
    {
      id: generateId(),
      shop_id: DEMO_SHOP_ID,
      name: "Posho 1kg",
      unit: "kg",
      sku_code: "",
      selling_price: 2800,
      buying_price: 2200,
      stock_qty: 30,
      is_fast_mover: true,
      photo_url: "",
      active: true,
      server_updated_at: now,
    },
    {
      id: generateId(),
      shop_id: DEMO_SHOP_ID,
      name: "Rice 1kg",
      unit: "kg",
      sku_code: "",
      selling_price: 5000,
      buying_price: 4000,
      stock_qty: 15,
      is_fast_mover: true,
      photo_url: "",
      active: true,
      server_updated_at: now,
    },
    {
      id: generateId(),
      shop_id: DEMO_SHOP_ID,
      name: "Soda 500ml",
      unit: "pc",
      sku_code: "",
      selling_price: 1500,
      buying_price: 1200,
      stock_qty: 24,
      is_fast_mover: true,
      photo_url: "",
      active: true,
      server_updated_at: now,
    },
    {
      id: generateId(),
      shop_id: DEMO_SHOP_ID,
      name: "Water 500ml",
      unit: "pc",
      sku_code: "",
      selling_price: 1000,
      buying_price: 700,
      stock_qty: 24,
      is_fast_mover: true,
      photo_url: "",
      active: true,
      server_updated_at: now,
    },
    {
      id: generateId(),
      shop_id: DEMO_SHOP_ID,
      name: "Eggs",
      unit: "pc",
      sku_code: "",
      selling_price: 700,
      buying_price: 500,
      stock_qty: 30,
      is_fast_mover: true,
      photo_url: "",
      active: true,
      server_updated_at: now,
    },
  ];

  const movements: StockMovement[] = products.map((p) => ({
    id: generateId(),
    shop_id: DEMO_SHOP_ID,
    product_id: p.id,
    type: "receive" as const,
    qty_delta: p.stock_qty,
    reason: "opening stock",
    user_id: DEMO_OWNER_ID,
    created_at: now,
    ref_id: "",
  }));

  await db.transaction(
    "rw",
    [db.businesses, db.shops, db.users, db.products, db.stock_movements],
    async () => {
      await db.businesses.add(business);
      await db.shops.add(shop);
      await db.users.add(owner);
      await db.products.bulkAdd(products);
      await db.stock_movements.bulkAdd(movements);
    }
  );
}


