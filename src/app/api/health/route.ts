import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "Kan",
    entity: "Pwata Inc",
    database: process.env.DATABASE_URL ? "configured" : "not_configured",
    paymentsWebhook:
      process.env.FLW_WEBHOOK_SECRET || process.env.MOMO_WEBHOOK_SECRET
        ? "configured"
        : "not_configured",
    ai: process.env.GEMINI_API_KEY ? "configured" : "not_configured",
    timestamp: new Date().toISOString(),
  });
}
