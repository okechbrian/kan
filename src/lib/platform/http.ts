import { NextResponse } from "next/server";
import { PlatformError, PlatformNotConfiguredError } from "./service";

export function platformErrorResponse(error: unknown) {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  if (name === "PrismaClientInitializationError") {
    return NextResponse.json(
      { error: "database_not_configured", message: "The platform opens when cloud sync is configured." },
      { status: 503 }
    );
  }
  if (error instanceof PlatformNotConfiguredError) {
    return NextResponse.json(
      { error: "database_not_configured", message: "The platform opens when cloud sync is configured." },
      { status: 503 }
    );
  }
  if (error instanceof PlatformError) {
    return NextResponse.json({ error: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}

export function sessionToken(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)kan_session=([^;]+)/);
  return match?.[1];
}

export function sessionCookie(token: string) {
  return `kan_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

export const CLEAR_SESSION_COOKIE =
  "kan_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
