import { savePublicLead, publicLeadJson } from "../../../../lib/platform/leads";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return publicLeadJson({ error: "invalid_json" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const businessName =
    typeof body.businessName === "string" ? body.businessName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const digits = phone.replace(/\D/g, "");

  if (!email.includes("@") || email.length < 5) {
    return publicLeadJson({ error: "invalid_email" }, 400);
  }
  if (!businessName) {
    return publicLeadJson({ error: "business_name_required" }, 400);
  }
  if (digits.length < 7) {
    return publicLeadJson({ error: "invalid_phone" }, 400);
  }

  const referenceId = `KAN-DEL-${Date.now().toString(36).toUpperCase()}`;
  await savePublicLead({
    kind: "account_deletion",
    email,
    businessName,
    phone,
    message: reason,
    referenceId,
  });

  return publicLeadJson({
    ok: true,
    referenceId,
    retentionNote:
      "Active account data is deleted after verification (within 90 days of closure). Transaction records required by Ugandan law may be retained for up to 7 years.",
  });
}
