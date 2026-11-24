import { NextResponse } from "next/server";
import { platformErrorResponse, sessionToken } from "../../../../../../lib/platform/http";
import { PlatformService } from "../../../../../../lib/platform/service";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const service = PlatformService.create();
    const ctx = await service.requireSession(sessionToken(request));
    const body = await request.json().catch(() => ({}));
    await service.changePlan(ctx, params.id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return platformErrorResponse(error);
  }
}
