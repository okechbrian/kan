import { NextResponse } from "next/server";
import { platformErrorResponse, sessionToken } from "../../../../lib/platform/http";
import { PlatformService } from "../../../../lib/platform/service";

export async function GET(request: Request) {
  try {
    const service = PlatformService.create();
    const ctx = await service.requireSession(sessionToken(request));
    const workspace = await service.getWorkspace(ctx);
    return NextResponse.json({ shops: workspace.shops, plan: workspace.subscription?.plan ?? "basic" });
  } catch (error) {
    return platformErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const service = PlatformService.create();
    const ctx = await service.requireSession(sessionToken(request));
    const shop = await service.createBranch(ctx, body);
    return NextResponse.json({ shop }, { status: 201 });
  } catch (error) {
    return platformErrorResponse(error);
  }
}
