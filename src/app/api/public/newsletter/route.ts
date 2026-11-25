import { savePublicLead, publicLeadJson } from "../../../../lib/platform/leads";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return publicLeadJson({ error: "invalid_json" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return publicLeadJson({ error: "invalid_email" }, 400);
  }

  await savePublicLead({ kind: "newsletter", email });

  return publicLeadJson({
    ok: true,
    email,
    message: "Subscribed. We will send important Kan release updates to this address.",
  });
}
