import crypto from "crypto";
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  verifyWebhookSignature,
  parseUgandaPaymentWebhook,
} from "../src/lib/payments/webhooks";
import { GET as healthGet } from "../src/app/api/health/route";
import { POST as webhookPost } from "../src/app/api/payments/webhook/route";

const root = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

describe("Phase 7 — Uganda payment webhooks", () => {
  it("verifies HMAC-SHA256 and direct Flutterwave signatures in constant time", () => {
    const body = JSON.stringify({ amount: 25000, currency: "UGX" });
    const secret = "test-secret-uganda-123";
    const hmac = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("hex");

    expect(verifyWebhookSignature(body, hmac, secret, "hmac")).toBe(true);
    expect(verifyWebhookSignature(body, "bad-sig", secret, "hmac")).toBe(false);
    expect(verifyWebhookSignature(body, secret, secret, "direct")).toBe(true);
    expect(verifyWebhookSignature(body, "wrong", secret, "direct")).toBe(false);
  });

  it("enforces integer UGX shillings and required identifiers", () => {
    const valid = parseUgandaPaymentWebhook("mtn_momo", {
      currency: "UGX",
      amount: 15000,
      reference: "MOMO-REF-01",
      sale_id: "sale-1",
      shop_id: "shop-1",
      status: "successful",
    });
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.event.amount).toBe(15000);
      expect(valid.event.status).toBe("confirmed");
    }

    const badCurrency = parseUgandaPaymentWebhook("flutterwave", {
      data: { currency: "NGN", amount: 15000, tx_ref: "x", meta: { sale_id: "s", shop_id: "sh" } },
    });
    expect(badCurrency.ok).toBe(false);

    const floatAmount = parseUgandaPaymentWebhook("mtn_momo", {
      currency: "UGX",
      amount: 1500.5,
      reference: "MOMO-REF-02",
      sale_id: "sale-1",
      shop_id: "shop-1",
      status: "successful",
    });
    expect(floatAmount.ok).toBe(false);
  });

  it("returns honest 503 gateway_not_configured when webhook secrets are unset", async () => {
    const prevFlw = process.env.FLW_WEBHOOK_SECRET;
    const prevMomo = process.env.MOMO_WEBHOOK_SECRET;
    delete process.env.FLW_WEBHOOK_SECRET;
    delete process.env.MOMO_WEBHOOK_SECRET;
    try {
      const req = new Request("http://localhost/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-kan-provider": "mtn_momo" },
        body: JSON.stringify({ amount: 5000, currency: "UGX" }),
      });
      const res = await webhookPost(req);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toBe("gateway_not_configured");
    } finally {
      if (prevFlw) process.env.FLW_WEBHOOK_SECRET = prevFlw;
      if (prevMomo) process.env.MOMO_WEBHOOK_SECRET = prevMomo;
    }
  });
});

describe("Phase 7 — Health, Security Headers, AI Assistant & Wallet", () => {
  it("returns safe health metadata without leaking secrets", async () => {
    const res = await healthGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.product).toBe("Kan");
    expect(data.entity).toBe("Pwata Inc");
    expect(["configured", "not_configured"]).toContain(data.database);
    expect(["configured", "not_configured"]).toContain(data.paymentsWebhook);
    expect(["configured", "not_configured"]).toContain(data.ai);
  });

  it("configures production security headers in next.config.js", () => {
    const cfg = read("next.config.js");
    expect(cfg).toContain("X-Frame-Options");
    expect(cfg).toContain("X-Content-Type-Options");
    expect(cfg).toContain("Referrer-Policy");
    expect(cfg).toContain("Permissions-Policy");
  });

  it("wires /app/assistant, /app/wallet, and /app/payments routes cleanly", () => {
    expect(read("src/app/app/assistant/page.tsx")).toContain("AiPanel");
    expect(read("src/app/app/wallet/page.tsx")).toContain("BankingPanel");
    expect(read("src/app/app/payments/page.tsx")).toContain("PaymentsPanel");
    const chrome = read("src/components/dashboard/DashboardChrome.tsx");
    expect(chrome).toContain("/app/payments");
    expect(chrome).toContain("/app/assistant");
    expect(chrome).toContain("/app/wallet");
  });
});
