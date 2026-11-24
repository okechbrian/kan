import { NextResponse } from "next/server";
import { platformErrorResponse, sessionCookie } from "../../../../lib/platform/http";
import { PlatformService } from "../../../../lib/platform/service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await PlatformService.create().login(body);
    const response = NextResponse.json({ account: result.account });
    response.headers.set("Set-Cookie", sessionCookie(result.token));
    return response;
  } catch (error) {
    return platformErrorResponse(error);
  }
}
