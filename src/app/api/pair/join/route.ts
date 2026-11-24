import { NextResponse } from "next/server";
import crypto from "crypto";

function generateId(): string {
  return crypto.randomUUID();
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
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
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Cloud not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { shopCode, pinHash } = body;

    if (!shopCode || !pinHash) {
      return NextResponse.json(
        { error: "Missing shop code or PIN" },
        { status: 400 }
      );
    }

    const shop = await prisma.shop.findUnique({
      where: { shop_code: shopCode.toUpperCase() },
      include: { business: true },
    });

    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    const owner = await prisma.user.findFirst({
      where: {
        business_id: shop.business_id,
        role: "owner",
        pin_hash: pinHash,
      },
    });

    if (!owner) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      );
    }

    const deviceToken = generateToken();
    const deviceId = generateId();

    await prisma.device.create({
      data: {
        id: deviceId,
        shop_id: shop.id,
        token: deviceToken,
        name: "Joined device",
      },
    });

    const products = await prisma.product.findMany({
      where: { shop_id: shop.id },
    });
    const customers = await prisma.customer.findMany({
      where: { shop_id: shop.id },
    });
    const users = await prisma.user.findMany({
      where: { business_id: shop.business_id },
    });
    const stock_movements = await prisma.stockMovement.findMany({
      where: { shop_id: shop.id },
    });
    const sales = await prisma.sale.findMany({
      where: { shop_id: shop.id },
    });
    const saleIds = sales.map((s: { id: string }) => s.id);
    const sale_lines =
      saleIds.length > 0
        ? await prisma.saleLine.findMany({ where: { sale_id: { in: saleIds } } })
        : [];
    const tenders =
      saleIds.length > 0
        ? await prisma.tender.findMany({ where: { sale_id: { in: saleIds } } })
        : [];
    const deni_ledger = await prisma.deniLedger.findMany({
      where: { shop_id: shop.id },
    });
    const cash_movements = await prisma.cashMovement.findMany({
      where: { shop_id: shop.id },
    });
    const shifts = await prisma.shift.findMany({
      where: { shop_id: shop.id },
    });

    return NextResponse.json({
      shop: {
        id: shop.id,
        name: shop.name,
        shop_code: shop.shop_code,
        business_id: shop.business_id,
        momo_number: shop.momo_number,
      },
      user: { id: owner.id, name: owner.name, role: owner.role },
      token: deviceToken,
      snapshot: {
        products,
        customers,
        users,
        stock_movements,
        sales,
        sale_lines,
        tenders,
        deni_ledger,
        cash_movements,
        shifts,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to join shop" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
