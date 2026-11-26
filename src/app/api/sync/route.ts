import { NextResponse } from "next/server";
import { applySyncBatch, deviceIdentity, readShopSnapshot, SyncError, SYNC_TRANSACTION_OPTIONS } from "../../../lib/server-sync";
import { getServerDb } from "../../../lib/server-db";
export const maxDuration = 60;

async function handle(req: Request, push: boolean) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prisma = getServerDb();
  if (!prisma) return NextResponse.json({ error: "Cloud not configured" }, { status: 503 });
  try {
    const identity = await deviceIdentity(prisma, auth.slice(7));
    if (!identity) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    if (push) {
      const body = await req.json().catch(() => null);
      const acknowledged = await prisma.$transaction((tx) => applySyncBatch(tx, identity, body?.mutations), SYNC_TRANSACTION_OPTIONS);
      return NextResponse.json({ protocol: 2, acknowledged, applied: acknowledged.length });
    }
    // Full, consistent snapshots deliberately avoid timestamp cursors. Client clocks and
    // concurrent commits cannot cause missed voids, closes, or late offline sales.
    const rows = await prisma.$transaction((tx) => readShopSnapshot(tx, identity), { ...SYNC_TRANSACTION_OPTIONS, isolationLevel: "RepeatableRead" });
    return NextResponse.json({ protocol: 2, shop_id: identity.shopId, rows, new_cursor: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyncError) return NextResponse.json({ error: error.message }, { status: error.status });
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    if (["P1001", "P1002", "P2024", "P2028"].includes(code)) return NextResponse.json({ error: "Sync temporarily unavailable; changes are still pending", code }, { status: 503 });
    return NextResponse.json({ error: "Sync not committed; retry pending changes" }, { status: 409 });
  }
}
export async function GET(req: Request) { return handle(req, false); }
export async function POST(req: Request) { return handle(req, true); }
