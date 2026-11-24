import { NextResponse } from "next/server";
import { APPEND_TABLES, CATALOG_TABLES, PRISMA_DELEGATE } from "../../../lib/sync-core";

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
): Promise<{ shopId: string } | null> {
  const device = await prisma.device.findUnique({ where: { token } });
  if (!device) return null;
  return { shopId: device.shop_id };
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

    const shopId = identity.shopId;
    const rows: Record<string, unknown[]> = {};

    const timeWhere = sinceDate
      ? { created_at: { gt: sinceDate } }
      : {};
    const updatedWhere = sinceDate
      ? { updated_at: { gt: sinceDate } }
      : {};

    rows.products = await prisma.product.findMany({
      where: { shop_id: shopId, ...updatedWhere },
    });
    rows.customers = await prisma.customer.findMany({
      where: { shop_id: shopId },
    });
    rows.users = await prisma.user.findMany({
      where: { OR: [{ shop_id: shopId }, { shop_id: null }] },
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

      const data = { ...payload, id: row_id };
      if (table === "products") delete data.stock_qty;
      if (CATALOG_TABLES.has(table)) {
        data.server_updated_at = new Date();
      }

      try {
        if (op === "void" && table === "sales" && model.update) {
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
