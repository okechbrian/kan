import { NextResponse } from "next/server";
import { platformErrorResponse } from "../../../../../lib/platform/http";
import { PlatformService } from "../../../../../lib/platform/service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const service = PlatformService.create();
    const result = await service.requestPasswordReset(body);
    return NextResponse.json(result);
  } catch (error) {
    return platformErrorResponse(error);
  }
}
