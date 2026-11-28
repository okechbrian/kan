import { NextResponse } from "next/server";
import { PlatformService } from "../../../../lib/platform/service";
import { platformErrorResponse, sessionToken } from "../../../../lib/platform/http";
import { getServerDb } from "../../../../lib/server-db";
import { pairCloudBranch } from "../../../../lib/platform/pairing";

export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const service = PlatformService.create();
    const ctx = await service.requireSession(sessionToken(request));
    const result = await pairCloudBranch(getServerDb()!, ctx, await request.json().catch(() => null));
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return platformErrorResponse(error); }
}
