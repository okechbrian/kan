import { NextResponse } from "next/server";
import { platformErrorResponse, sessionToken } from "../../../../../../lib/platform/http";
import { PlatformService } from "../../../../../../lib/platform/service";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const service = PlatformService.create();
    const ctx = await service.requireSession(sessionToken(request));
    const body = await request.json().catch(() => ({}));
    const result = await service.inviteStaff(ctx, params.id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return platformErrorResponse(error);
  }
}
