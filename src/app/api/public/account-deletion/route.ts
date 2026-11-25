import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const businessName =
    typeof body.businessName === "string" ? body.businessName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const digits = phone.replace(/\D/g, "");

  if (!email.includes("@") || email.length < 5) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!businessName) {
    return NextResponse.json({ error: "business_name_required" }, { status: 400 });
  }
  if (digits.length < 7) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const referenceId = `KAN-DEL-${Date.now().toString(36).toUpperCase()}`;
  return NextResponse.json({
    ok: true,
    referenceId,
    retentionNote:
      "Active account data is deleted after verification (within 90 days of closure). Transaction records required by Ugandan law may be retained for up to 7 years.",
  });
}
