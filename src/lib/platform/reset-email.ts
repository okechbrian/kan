import { hashSecret } from "./tokens";
import type { PlatformStore } from "./store";

export function recoveryOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
    if (url.username || url.password || (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname)))) return null;
    return url.origin;
  } catch { return null; }
}

export function resetEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM &&
    !/[\r\n]/.test(process.env.EMAIL_FROM) && recoveryOrigin());
}

/** Only private reset notifications are eligible; never expose the body/token. */
export async function deliverResetEmail(store: PlatformStore, id: string, send: typeof fetch = fetch) {
  const row = await store.findResetEmail(id);
  if (!row || !["pending", "failed"].includes(String(row.status))) return;
  if (!resetEmailConfigured()) {
    await store.finishResetEmail(id, "failed", "email_not_configured");
    return;
  }
  let token: string;
  try {
    const link = new URL(String(row.body).split(" ").at(-1)!);
    if (link.origin !== recoveryOrigin() || link.pathname !== "/app/reset-password") throw new Error("untrusted_link");
    token = link.searchParams.get("token") ?? "";
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error("invalid_token");
  } catch {
    await store.finishResetEmail(id, "canceled", "invalid_reset_link");
    return;
  }
  const record = await store.findPasswordResetToken(hashSecret(token));
  const account = record ? await store.findAccountById(String(record.account_id)) : null;
  if (!record || record.used_at || new Date(String(record.expires_at)).getTime() <= Date.now() ||
      !account || account.active === false || account.email !== row.recipient || account.business_id !== row.business_id) {
    await store.finishResetEmail(id, "canceled", "reset_no_longer_valid");
    return;
  }
  // Retry the same immutable payload/key within the one-hour token lifetime.
  // Resend deduplicates matching keys for 24 hours, including concurrent sends.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const response = await send("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `kan-password-reset/${id}` },
        body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [String(row.recipient)], subject: String(row.subject), text: String(row.body) }),
      });
      if (response.ok) {
        const result = await response.json() as { id?: unknown };
        if (typeof result.id !== "string" || !result.id) throw new Error("invalid_provider_response");
        await store.finishResetEmail(id, "sent");
        return;
      }
      if (response.status !== 429 && response.status !== 409 && response.status < 500) {
        await store.finishResetEmail(id, "failed", "provider_rejected");
        return;
      }
    } catch { /* Do not store provider responses, addresses or credentials in errors. */ }
  }
  await store.finishResetEmail(id, "failed", "provider_unavailable");
}
