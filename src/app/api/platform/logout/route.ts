import { NextResponse } from "next/server";
import { CLEAR_SESSION_COOKIE, platformErrorResponse, sessionToken } from "../../../../lib/platform/http";
import { PlatformService } from "../../../../lib/platform/service";

export async function POST(request: Request) {
  try {
    const service = PlatformService.create();
    const ctx = await service.requireSession(sessionToken(request));
    await service.logout(sessionToken(request) ?? "", ctx);
    const response = NextResponse.json({ ok: true });
    response.headers.set("Set-Cookie", CLEAR_SESSION_COOKIE);
    return response;
  } catch (error) {
    return platformErrorResponse(error);
  }
}
