import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

type OrderItemInput = {
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const customerPhone =
    typeof body.customerPhone === "string" ? body.customerPhone.trim() : "";
  const deliveryBand =
    typeof body.deliveryBand === "string" ? body.deliveryBand.trim() : "Pickup";
  const deliveryFee = Number(body.deliveryFee ?? 0);
  const rawItems = Array.isArray(body.items) ? (body.items as OrderItemInput[]) : [];

  if (!slug) {
    return NextResponse.json({ error: "slug_required" }, { status: 400 });
  }
  if (customerPhone.replace(/\D/g, "").length < 7) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }
  if (!Number.isInteger(deliveryFee) || deliveryFee < 0) {
    return NextResponse.json({ error: "invalid_delivery_fee" }, { status: 400 });
  }
  if (rawItems.length === 0) {
    return NextResponse.json({ error: "empty_items" }, { status: 400 });
  }

  let subtotal = 0;
  const cleanItems: { productId: string; name: string; qty: number; lineTotal: number }[] = [];
  for (const item of rawItems) {
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const qty = Number(item.qty);
    const unitPrice = Number(item.unitPrice);
    if (
      !name ||
      !Number.isInteger(qty) ||
      qty <= 0 ||
      !Number.isInteger(unitPrice) ||
      unitPrice <= 0
    ) {
      return NextResponse.json({ error: "invalid_item" }, { status: 400 });
    }
    const lineTotal = qty * unitPrice;
    subtotal += lineTotal;
    cleanItems.push({
      productId: typeof item.productId === "string" ? item.productId : name,
      name,
      qty,
      lineTotal,
    });
  }

  const total = subtotal + deliveryFee;
  const orderId = `KAN-ORD-${Date.now().toString(36).toUpperCase()}`;

  if (process.env.DATABASE_URL) {
    try {
      // eslint-disable-next-line
      const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
      const db = new PrismaClient();
      try {
        const storefront = await db.storefront.findUnique({ where: { slug } });
        if (storefront) {
          await db.storeOrder.create({
            data: {
              id: orderId,
              shop_id: storefront.shop_id,
              slug,
              customer_phone: customerPhone,
              delivery_band: deliveryBand,
              subtotal,
              delivery_fee: deliveryFee,
              total,
              status: "pending",
              items: {
                create: cleanItems.map((it) => ({
                  id: randomUUID(),
                  product_id: it.productId,
                  name: it.name,
                  quantity: it.qty,
                  line_total: it.lineTotal,
                })),
              },
            },
          });
        }
      } finally {
        await db.$disconnect();
      }
    } catch {
      // Non-blocking fallback when offline or storefront not yet published to Postgres.
    }
  }

  return NextResponse.json(
    {
      ok: true,
      orderId,
      subtotal,
      deliveryFee,
      total,
      status: "pending",
    },
    { status: 201 },
  );
}
