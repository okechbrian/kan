import { NextResponse } from "next/server";
import {
  APPEND_TABLES,
  CATALOG_TABLES,
  PRISMA_DELEGATE,
} from "../../../lib/sync-core";

const SHOP_SCOPED_TABLES = new Set([
  "products",
  "customers",
  "shifts",
  "sales",
  "stock_movements",
  "deni_ledger",
  "cash_movements",
]);

async function getPrisma() {
  try {
    const { PrismaClient } = require("@prisma/client");
    return new PrismaClient();
  } catch {
    return null;
  }
}

function delegate(
  prisma: Record<string, unknown>,
  table: string
): {
  findMany?: (args: unknown) => Promise<unknown[]>;
  findUnique?: (args: unknown) => Promise<unknown>;
  create?: (args: unknown) => Promise<unknown>;
  upsert?: (args: unknown) => Promise<unknown>;
  update?: (args: unknown) => Promise<unknown>;
} | null {
  const name = PRISMA_DELEGATE[table];
  if (!name) return null;
  const d = prisma[name];
  if (!d || typeof d !== "object") return null;
  return d as {
    findMany?: (args: unknown) => Promise<unknown[]>;
    findUnique?: (args: unknown) => Promise<unknown>;
    create?: (args: unknown) => Promise<unknown>;
    upsert?: (args: unknown) => Promise<unknown>;
    update?: (args: unknown) => Promise<unknown>;
  };
}

async function verifyToken(
  prisma: NonNullable<Awaited<ReturnType<typeof getPrisma>>>,
  token: string
): Promise<{ shopId: string; businessId: string } | null> {
  const device = await prisma.device.findUnique({
    where: { token },
    include: { shop: { select: { business_id: true } } },
  });
  if (!device || !device.shop) return null;
  return { shopId: device.shop_id, businessId: device.shop.business_id };
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

  try {
    const identity = await verifyToken(prisma, authHeader.slice(7));
    if (!identity) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const sinceRaw = new URL(req.url).searchParams.get("since") || "0";
    const sinceDate =
      sinceRaw !== "0" && !Number.isNaN(Date.parse(sinceRaw))
        ? new Date(sinceRaw)
        : null;

    const { shopId, businessId } = identity;
    const rows: Record<string, unknown[]> = {};

    const timeWhere = sinceDate ? { created_at: { gt: sinceDate } } : {};
    const updatedWhere = sinceDate ? { updated_at: { gt: sinceDate } } : {};

    rows.products = await prisma.product.findMany({
      where: { shop_id: shopId, ...updatedWhere },
    });
    rows.customers = await prisma.customer.findMany({
      where: { shop_id: shopId },
    });
    rows.users = await prisma.user.findMany({
      where: {
        business_id: businessId,
        OR: [{ shop_id: shopId }, { shop_id: null }],
      },
    });
    rows.shifts = await prisma.shift.findMany({
      where: { shop_id: shopId, ...timeWhere },
    });
    rows.sales = await prisma.sale.findMany({
      where: { shop_id: shopId, ...timeWhere },
    });
    const saleIds = (rows.sales as { id: string }[]).map((s) => s.id);
    rows.sale_lines =
      saleIds.length > 0
        ? await prisma.saleLine.findMany({
            where: { sale_id: { in: saleIds } },
          })
        : [];
    rows.tenders =
      saleIds.length > 0
        ? await prisma.tender.findMany({
            where: { sale_id: { in: saleIds } },
          })
        : [];
    rows.stock_movements = await prisma.stockMovement.findMany({
      where: { shop_id: shopId, ...timeWhere },
    });
    rows.deni_ledger = await prisma.deniLedger.findMany({
      where: { shop_id: shopId, ...timeWhere },
    });
    rows.cash_movements = await prisma.cashMovement.findMany({
      where: { shop_id: shopId, ...timeWhere },
    });

    for (const p of rows.products as { stock_qty?: number }[]) {
      delete p.stock_qty;
    }

    const newCursor = new Date().toISOString();
    return NextResponse.json({ rows, new_cursor: newCursor });
  } finally {
    await prisma.$disconnect();
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

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const identity = await verifyToken(prisma, authHeader.slice(7));
    if (!identity) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { mutations } = body;
    if (!Array.isArray(mutations)) {
      return NextResponse.json(
        { error: "Invalid mutations" },
        { status: 400 }
      );
    }

    let applied = 0;
    const p = prisma as unknown as Record<string, unknown>;

    for (const mutation of mutations) {
      const { table, row_id, op, payload } = mutation;
      const model = delegate(p, table);
      if (!model || !row_id || !op) continue;

      // Enforce multi-shop tenant isolation
      if (SHOP_SCOPED_TABLES.has(table)) {
        if (payload?.shop_id && payload.shop_id !== identity.shopId) {
          continue;
        }
      }
      if (table === "users") {
        if (payload?.business_id && payload.business_id !== identity.businessId) {
          continue;
        }
        if (payload?.shop_id && payload.shop_id !== identity.shopId) {
          continue;
        }
      }
      if (table === "sale_lines" || table === "tenders") {
        const parentSaleId = payload?.sale_id;
        if (!parentSaleId) continue;
        const parentSale = await prisma.sale.findUnique({
          where: { id: parentSaleId },
          select: { shop_id: true },
        });
        if (!parentSale || parentSale.shop_id !== identity.shopId) {
          continue;
        }
      }

      const data: Record<string, unknown> = { ...payload, id: row_id };
      if (SHOP_SCOPED_TABLES.has(table)) {
        data.shop_id = identity.shopId;
      }
      if (table === "users") {
        data.business_id = identity.businessId;
      }
      if (table === "products") delete data.stock_qty;
      if (CATALOG_TABLES.has(table)) {
        data.server_updated_at = new Date();
      }

      try {
        if (op === "void" && table === "sales" && model.update) {
          const existingSale = await prisma.sale.findUnique({
            where: { id: row_id },
            select: { shop_id: true },
          });
          if (!existingSale || existingSale.shop_id !== identity.shopId) {
            continue;
          }
          await model.update({
            where: { id: row_id },
            data: {
              status: "voided",
              void_reason: payload?.void_reason || "",
            },
          });
          applied++;
          continue;
        }

        if (APPEND_TABLES.has(table) && model.findUnique && model.create) {
          const existing = await model.findUnique({ where: { id: row_id } });
          if (!existing) {
            await model.create({ data });
            applied++;
          }
          continue;
        }

        if (model.upsert) {
          if (SHOP_SCOPED_TABLES.has(table) && model.findUnique) {
            const existing = (await model.findUnique({
              where: { id: row_id },
            })) as { shop_id?: string } | null;
            if (existing && existing.shop_id !== identity.shopId) {
              continue;
            }
          }
          await model.upsert({
            where: { id: row_id },
            create: data,
            update: data,
          });
          applied++;
        }
      } catch {
        // skip bad row
      }
    }

    return NextResponse.json({ applied });
  } finally {
    await prisma.$disconnect();
  }
}
