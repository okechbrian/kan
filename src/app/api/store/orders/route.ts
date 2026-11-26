import { NextResponse } from "next/server";

/** Live ordering is not released. Never fabricate an order ID or accept client prices. */
export async function POST(_request: Request) {
  return NextResponse.json(
    { error: "ordering_not_available", message: "Online ordering is coming soon. No order was created or payment taken." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
