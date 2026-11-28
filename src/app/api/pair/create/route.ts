import { NextResponse } from "next/server";
import crypto from "crypto";

function generateId(): string {
  return crypto.randomUUID();
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
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

export async function POST(req: Request) {
  if (/(?:^|;\s*)kan_session=/.test(req.headers.get("cookie") ?? "")) {
    return NextResponse.json({ error: "Use your existing cloud workspace to connect a branch instead of creating another business." }, { status: 409 });
  }
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Cloud not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { businessName, shopName, ownerName, pinHash, momoNumber } = body;

    if (!businessName || !shopName || !ownerName || !pinHash) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const businessId = generateId();
    const shopId = generateId();
    const userId = generateId();
    const deviceToken = generateToken();
    const deviceId = generateId();
    const shopCode = generateShopCode();

    await prisma.business.create({
      data: {
        id: businessId,
        name: businessName,
      },
    });

    await prisma.shop.create({
      data: {
        id: shopId,
        business_id: businessId,
        name: shopName,
        shop_code: shopCode,
        momo_number: momoNumber || "",
      },
    });

    await prisma.user.create({
      data: {
        id: userId,
        business_id: businessId,
        shop_id: shopId,
        name: ownerName,
        role: "owner",
        pin_hash: pinHash,
      },
    });

    await prisma.device.create({
      data: {
        id: deviceId,
        shop_id: shopId,
        token: deviceToken,
        name: "Owner device",
      },
    });

    return NextResponse.json({
      business_id: businessId,
      shop: { id: shopId, name: shopName, shop_code: shopCode },
      user: { id: userId, name: ownerName, role: "owner" },
      token: deviceToken,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create shop" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
