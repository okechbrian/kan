import { NextResponse } from "next/server";
import crypto from "crypto";

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

async function verifyOwnerToken(
  prisma: NonNullable<Awaited<ReturnType<typeof getPrisma>>>,
  token: string
): Promise<{ userId: string; shopId: string } | null> {
  const device = await prisma.device.findUnique({ where: { token } });
  if (!device) return null;
  const user = await prisma.user.findFirst({
    where: { shop_id: device.shop_id, role: "owner" },
  });
  if (!user) return null;
  return { userId: user.id, shopId: device.shop_id };
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

  try {
    const identity = await verifyOwnerToken(prisma, authHeader.slice(7));
    if (!identity) {
      return NextResponse.json({ error: "Owner only" }, { status: 403 });
    }

    const body = await req.json();
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: "shopId required" },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const user = await prisma.user.findFirst({
      where: { id: identity.userId },
    });
    if (!user || user.business_id !== shop.business_id) {
      return NextResponse.json({ error: "Owner only" }, { status: 403 });
    }

    const newCode = generateShopCode();
    await prisma.shop.update({
      where: { id: shopId },
      data: { shop_code: newCode, server_updated_at: new Date() },
    });

    return NextResponse.json({ shop_code: newCode });
  } catch {
    return NextResponse.json(
      { error: "Failed to rotate code" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
