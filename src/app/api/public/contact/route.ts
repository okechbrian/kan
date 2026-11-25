import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  const digits = phone.replace(/\D/g, "");
  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }
  if (digits.length < 7) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }
  if (!email.includes("@") || email.length < 5) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: "message_too_short" }, { status: 400 });
  }

  const referenceId = `KAN-INQ-${Date.now().toString(36).toUpperCase()}`;
  return NextResponse.json({
    ok: true,
    referenceId,
    message: "Your enquiry has been logged. Pwata Inc support will reach out on your phone or email.",
  });
}
