import { NextResponse } from "next/server";
import { platformErrorResponse, sessionToken } from "../../../../lib/platform/http";
import { PlatformService } from "../../../../lib/platform/service";

export async function GET(request: Request) {
  try {
    const service = PlatformService.create();
    const ctx = await service.requireSession(sessionToken(request));
    const workspace = await service.getWorkspace(ctx);
    return NextResponse.json(workspace);
  } catch (error) {
    return platformErrorResponse(error);
  }
}
