import { NextResponse } from "next/server";
import { platformErrorResponse } from "../../../../../lib/platform/http";
import { PlatformService } from "../../../../../lib/platform/service";
import { waitUntil } from "@vercel/functions";
import { deliverResetEmail, resetEmailConfigured } from "../../../../../lib/platform/reset-email";
import { createPlatformStore } from "../../../../../lib/platform/store";
import { validateForgotPassword } from "../../../../../lib/platform/validation";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = validateForgotPassword(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    if (!resetEmailConfigured()) return NextResponse.json({ error: "recovery_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    const service = PlatformService.create();
    const result = await service.requestPasswordReset(body);
    if (result.notificationId) {
      // Keep provider work alive after the generic response, within this function's deadline.
      waitUntil(deliverResetEmail(createPlatformStore(), result.notificationId).catch(() => {}));
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return platformErrorResponse(error);
  }
}
