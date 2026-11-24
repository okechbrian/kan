import { NextResponse } from "next/server";
import { platformErrorResponse, sessionToken } from "../../../../lib/platform/http";
import { PlatformService } from "../../../../lib/platform/service";

export async function GET(request: Request) {
  try {
    const ctx = await PlatformService.create().requireSession(sessionToken(request));
    return NextResponse.json({
      accountId: ctx.accountId,
      businessId: ctx.businessId,
      role: ctx.role,
    });
  } catch (error) {
    return platformErrorResponse(error);
  }
}
