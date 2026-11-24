import { NextResponse } from "next/server";
import crypto from "crypto";

function generateId(): string {
  return crypto.randomUUID();
}

function generateShopCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code.slice(0, 4) + "-" + code.slice(4);
}

async function getPrisma() {
  try {

    const { PrismaClient } = require("@prisma/client");
    return new PrismaClient();
  } catch {
    return null;
  }
}

async function verifyToken(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  token: string
): Promise<{ userId: string; role: string } | null> {
  if (!prisma) return null;
  const device = await prisma.device.findUnique({ where: { token } });
  if (!device) return null;
  const user = await prisma.user.findFirst({
    where: { shop_id: device.shop_id, role: "owner" },
  });
  if (!user) return null;
  return { userId: user.id, role: user.role };
}

export async function POST(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Cloud not configured" },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const identity = await verifyToken(prisma, token);
  if (!identity || identity.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = await req.json();
  const { name, copyFromShopId } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const owner = await prisma.user.findFirst({
    where: { id: identity.userId },
  });
  if (!owner) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  const shopId = generateId();
  const shopCode = generateShopCode();

  await prisma.shop.create({
    data: {
      id: shopId,
      business_id: owner.business_id,
      name: name.trim(),
      shop_code: shopCode,
      momo_number: "",
    },
  });

  if (copyFromShopId) {
    const sourceProducts = await prisma.product.findMany({
      where: { shop_id: copyFromShopId },
    });

    for (const p of sourceProducts) {
      await prisma.product.create({
        data: {
          id: generateId(),
          shop_id: shopId,
          name: p.name,
          unit: p.unit,
          sku_code: p.sku_code,
          selling_price: p.selling_price,
          buying_price: p.buying_price,
          stock_qty: 0,
          is_fast_mover: p.is_fast_mover,
          photo_url: p.photo_url,
          active: p.active,
        },
      });
    }
  }

  return NextResponse.json({
    shop: { id: shopId, name: name.trim(), shop_code: shopCode },
  });
}

export async function GET(req: Request) {
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Cloud not configured" },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const identity = await verifyToken(prisma, token);
  if (!identity) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const owner = await prisma.user.findFirst({
    where: { id: identity.userId },
  });
  if (!owner) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  const shops = await prisma.shop.findMany({
    where: { business_id: owner.business_id },
  });

  const today = new Date().toISOString().slice(0, 10);


  const shopsWithStats = await Promise.all(
    (shops as any[]).map(async (shop: any) => {
      const sales = await prisma.sale.findMany({
        where: {
          shop_id: shop.id,
          status: "completed",
          created_at: { gte: today },
        },
      });

      const tenders = await prisma.tender.findMany({
        where: { sale_id: { in: (sales as any[]).map((s: any) => s.id) } },
      });

      const shift = await prisma.shift.findFirst({
        where: { shop_id: shop.id, status: "open" },
      });

      let cash = 0;
      let momo = 0;
      let credit = 0;
      for (const t of tenders as any[]) {
        if (t.method === "cash") cash += t.amount;
        else if (t.method === "mtn_momo" || t.method === "airtel_money")
          momo += t.amount;
        else if (t.method === "credit") credit += t.amount;
      }

      return {
        ...shop,
        todaySales: (sales as any[]).reduce((sum: number, s: any) => sum + s.total, 0),
        todayCount: (sales as any[]).length,
        cash,
        momo,
        credit,
        shiftOpen: !!shift,
      };
    })
  );


  return NextResponse.json({ shops: shopsWithStats });
}
