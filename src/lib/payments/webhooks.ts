import crypto from "crypto";

export type UgandaWebhookProvider = "flutterwave" | "mtn_momo" | "airtel_money";

export interface ParsedPaymentWebhook {
  provider: UgandaWebhookProvider;
  reference: string;
  saleId: string;
  shopId: string;
  amount: number;
  currency: "UGX";
  status: "confirmed" | "failed";
}

/**
 * Constant-time HMAC-SHA256 verification for payment gateway webhooks.
 * Also supports Flutterwave's `verif-hash` direct shared-secret header when
 * `mode === "direct"`.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined,
  mode: "hmac" | "direct" = "hmac"
): boolean {
  if (!signature || !secret) return false;
  const sigBuf = Buffer.from(signature.trim(), "utf8");
  if (mode === "direct") {
    const secBuf = Buffer.from(secret.trim(), "utf8");
    if (sigBuf.length !== secBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, secBuf);
  }
  const expected = crypto
    .createHmac("sha256", secret.trim())
    .update(rawBody, "utf8")
    .digest("hex");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Parse and validate an incoming Uganda mobile money or Flutterwave UGX webhook.
 * Strictly requires integer UGX shillings (> 0) and non-empty reference/saleId/shopId.
 */
export function parseUgandaPaymentWebhook(
  provider: UgandaWebhookProvider,
  payload: unknown
): { ok: true; event: ParsedPaymentWebhook } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "invalid_payload" };
  }
  const p = payload as Record<string, unknown>;
  const data =
    p.data && typeof p.data === "object"
      ? (p.data as Record<string, unknown>)
      : p;
  const meta =
    data.meta && typeof data.meta === "object"
      ? (data.meta as Record<string, unknown>)
      : {};

  const currency = String(data.currency ?? p.currency ?? "").toUpperCase();
  if (currency !== "UGX") {
    return { ok: false, error: "unsupported_currency" };
  }

  const amount = Number(data.amount ?? p.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: "invalid_ugx_amount" };
  }

  const reference = String(
    data.tx_ref ?? data.reference ?? data.externalId ?? p.reference ?? ""
  ).trim();
  const saleId = String(
    meta.sale_id ?? data.sale_id ?? p.sale_id ?? ""
  ).trim();
  const shopId = String(
    meta.shop_id ?? data.shop_id ?? p.shop_id ?? ""
  ).trim();

  if (!reference || !saleId || !shopId) {
    return { ok: false, error: "missing_identifiers" };
  }

  const rawStatus = String(data.status ?? p.status ?? "").toLowerCase();
  const status: "confirmed" | "failed" =
    rawStatus === "successful" ||
    rawStatus === "success" ||
    rawStatus === "confirmed" ||
    rawStatus === "completed"
      ? "confirmed"
      : "failed";

  return {
    ok: true,
    event: {
      provider,
      reference,
      saleId,
      shopId,
      amount,
      currency: "UGX",
      status,
    },
  };
}
