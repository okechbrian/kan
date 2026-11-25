import { savePublicLead, publicLeadJson } from "../../../../lib/platform/leads";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return publicLeadJson({ error: "invalid_json" }, 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  const digits = phone.replace(/\D/g, "");
  if (!name) {
    return publicLeadJson({ error: "name_required" }, 400);
  }
  if (digits.length < 7) {
    return publicLeadJson({ error: "invalid_phone" }, 400);
  }
  if (!email.includes("@") || email.length < 5) {
    return publicLeadJson({ error: "invalid_email" }, 400);
  }
  if (message.length < 10) {
    return publicLeadJson({ error: "message_too_short" }, 400);
  }

  const referenceId = `KAN-INQ-${Date.now().toString(36).toUpperCase()}`;
  await savePublicLead({
    kind: "contact",
    name,
    phone,
    email,
    message,
    referenceId,
  });

  return publicLeadJson({
    ok: true,
    referenceId,
    message:
      "Your enquiry has been logged. Pwata Inc support will reach out on your phone or email.",
  });
}
