import { NextResponse } from "next/server";
import { CLEAR_SESSION_COOKIE, platformErrorResponse } from "../../../../../lib/platform/http";
import { PlatformService } from "../../../../../lib/platform/service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const service = PlatformService.create();
    const result = await service.resetPassword(body);
    return NextResponse.json(result, { headers: { "Set-Cookie": CLEAR_SESSION_COOKIE, "Cache-Control": "no-store" } });
  } catch (error) {
    return platformErrorResponse(error);
  }
}
