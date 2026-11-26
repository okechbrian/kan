import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  parseUgandaPaymentWebhook,
  verifyWebhookSignature,
  type UgandaWebhookProvider,
} from "../../../../lib/payments/webhooks";

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { PrismaClient } = require("@prisma/client");
    return new PrismaClient();
  } catch {
    return null;
  }
}

function resolveProvider(req: Request): UgandaWebhookProvider {
  const header = (req.headers.get("x-kan-provider") ?? "").toLowerCase();
  if (header === "mtn_momo" || header === "airtel_money") return header;
  if (req.headers.get("verif-hash")) return "flutterwave";
  return "mtn_momo";
}

export async function POST(req: Request) {
  const provider = resolveProvider(req);
  const flwSecret = process.env.FLW_WEBHOOK_SECRET;
  const momoSecret = process.env.MOMO_WEBHOOK_SECRET;
  const secret = provider === "flutterwave" ? flwSecret : momoSecret;

  if (!secret) {
    return NextResponse.json(
      {
        error: "gateway_not_configured",
        provider,
        message:
          "Set FLW_WEBHOOK_SECRET or MOMO_WEBHOOK_SECRET in environment variables to enable live payment webhooks.",
      },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const isDirectFlw = provider === "flutterwave" && Boolean(req.headers.get("verif-hash"));
  const sig = isDirectFlw
    ? req.headers.get("verif-hash")
    : req.headers.get("x-kan-signature");

  if (!verifyWebhookSignature(rawBody, sig, secret, isDirectFlw ? "direct" : "hmac")) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseUgandaPaymentWebhook(provider, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { event } = parsed;
  const prisma = await getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { ok: true, persisted: false, reference: event.reference, status: event.status },
      { status: 202 }
    );
  }

  try {
    const existing = await prisma.payment.findFirst({
      where: { shop_id: event.shopId, reference: event.reference },
    });
    if (existing) {
      await prisma.payment.update({
        where: { id: existing.id },
        data: {
          status: event.status === "confirmed" ? "confirmed" : "pending",
          confirmed_at: event.status === "confirmed" ? new Date() : null,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          id: crypto.randomUUID(),
          shop_id: event.shopId,
          sale_id: event.saleId,
          method: event.provider === "flutterwave" ? "card" : event.provider,
          amount: event.amount,
          reference: event.reference,
          status: event.status === "confirmed" ? "confirmed" : "pending",
          confirmed_at: event.status === "confirmed" ? new Date() : null,
        },
      });
    }
    return NextResponse.json({
      ok: true,
      persisted: true,
      reference: event.reference,
      status: event.status,
    });
  } catch {
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
