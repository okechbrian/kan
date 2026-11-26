import { NextResponse } from "next/server";
import { platformErrorResponse, sessionToken } from "../../../../lib/platform/http";
import { PlatformService } from "../../../../lib/platform/service";

export async function GET(request: Request) {
  try {
    const service = PlatformService.create();
    const ctx = await service.requireSession(sessionToken(request));
    const workspace = await service.getWorkspace(ctx, new URL(request.url).searchParams.get("summary") === "1");
    return NextResponse.json(workspace, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return platformErrorResponse(error);
  }
}
