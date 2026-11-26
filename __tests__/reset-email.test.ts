import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deliverResetEmail, recoveryOrigin, resetEmailConfigured } from "../src/lib/platform/reset-email";
import type { PlatformRecord, PlatformStore } from "../src/lib/platform/store";
import { hashSecret, newSessionToken } from "../src/lib/platform/tokens";
import { PlatformService } from "../src/lib/platform/service";
import * as stores from "../src/lib/platform/store";
import * as email from "../src/lib/platform/reset-email";
import { POST } from "../src/app/api/platform/password/forgot/route";
import { waitUntil } from "@vercel/functions";
import * as passwords from "../src/lib/platform/password";
import { validateResetPassword } from "../src/lib/platform/validation";

vi.mock("@vercel/functions", () => ({ waitUntil: vi.fn() }));

function fixture() {
  const token = newSessionToken();
  const row: PlatformRecord = { id: "notification", business_id: "business", status: "pending", recipient: "owner@example.invalid", subject: "Reset your Kan password", body: `Reset your password: https://kan.example/app/reset-password?token=${token}` };
  const reset: PlatformRecord = { id: "reset", business_id: "", account_id: "owner", expires_at: new Date(Date.now() + 3600000) };
  const account: PlatformRecord = { id: "owner", business_id: "business", email: row.recipient, active: true };
  const finish = vi.fn(async (_id: string, status: string) => { if (["pending", "failed"].includes(String(row.status))) { row.status = status; if (status !== "failed") row.body = ""; } });
  const store = {
    findResetEmail: vi.fn(async () => ({ ...row })),
    findPasswordResetToken: vi.fn(async (hash: string) => hash === hashSecret(token) ? reset : null),
    findAccountById: vi.fn(async () => account),
    finishResetEmail: finish,
  } as unknown as PlatformStore;
  return { token, row, reset, account, store, finish };
}

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "test-provider-key");
  vi.stubEnv("EMAIL_FROM", "Kan <accounts@kan.example>");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kan.example");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("password recovery email", () => {
  it("uses the Resend API and stable idempotency key, then erases the private link", async () => {
    const f = fixture(), send = vi.fn(async () => Response.json({ id: "provider-message" }));
    await deliverResetEmail(f.store, f.row.id, send);
    expect(send).toHaveBeenCalledOnce();
    const [url, request] = send.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request.headers).toMatchObject({ "Idempotency-Key": "kan-password-reset/notification", Authorization: "Bearer test-provider-key" });
    expect(JSON.parse(String(request.body))).toMatchObject({ to: [f.row.recipient], from: "Kan <accounts@kan.example>" });
    expect(f.row.status).toBe("sent"); expect(f.row.body).toBe("");
    await deliverResetEmail(f.store, f.row.id, send);
    expect(send).toHaveBeenCalledOnce();
  });

  it("concurrent workers use exactly the same provider key and payload", async () => {
    const f = fixture(), send = vi.fn(async () => Response.json({ id: "same-message" }));
    await Promise.all([deliverResetEmail(f.store, f.row.id, send), deliverResetEmail(f.store, f.row.id, send)]);
    const requests = send.mock.calls.map((call) => (call as unknown as [string, RequestInit])[1]);
    expect(requests).toHaveLength(2);
    expect(requests[0].body).toBe(requests[1].body);
    expect(requests[0].headers).toEqual(requests[1].headers);
  });

  it("retries transient failures with the same idempotency key", async () => {
    const f = fixture();
    const send = vi.fn().mockResolvedValueOnce(new Response("", { status: 429 })).mockResolvedValueOnce(Response.json({ id: "retried" }));
    await deliverResetEmail(f.store, f.row.id, send);
    expect(send).toHaveBeenCalledTimes(2); expect(f.row.status).toBe("sent");
    expect(send.mock.calls[0][1].headers).toEqual(send.mock.calls[1][1].headers);
  });

  it("keeps failures retryable without storing provider response secrets", async () => {
    const f = fixture(), send = vi.fn(async () => new Response("test-provider-key secret", { status: 401 }));
    await deliverResetEmail(f.store, f.row.id, send);
    expect(f.finish).toHaveBeenCalledWith("notification", "failed", "provider_rejected");
    expect(f.row.status).toBe("failed"); expect(f.row.body).toContain(f.token);
    expect(JSON.stringify(f.finish.mock.calls)).not.toContain("test-provider-key");
  });

  it.each(["expired", "used", "disabled", "wrong-recipient"])("does not send a %s reset", async (kind) => {
    const f = fixture(), send = vi.fn();
    if (kind === "expired") f.reset.expires_at = new Date(Date.now() - 1);
    if (kind === "used") f.reset.used_at = new Date();
    if (kind === "disabled") f.account.active = false;
    if (kind === "wrong-recipient") f.account.email = "another@example.invalid";
    await deliverResetEmail(f.store, f.row.id, send);
    expect(send).not.toHaveBeenCalled(); expect(f.row.status).toBe("canceled"); expect(f.row.body).toBe("");
  });

  it("rejects an untrusted reset-link origin", async () => {
    const f = fixture(), send = vi.fn(); f.row.body = String(f.row.body).replace("kan.example", "attacker.invalid");
    await deliverResetEmail(f.store, f.row.id, send);
    expect(send).not.toHaveBeenCalled(); expect(f.row.status).toBe("canceled");
  });

  it("requires HTTPS and configured provider credentials in production", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(recoveryOrigin()).toBeNull(); expect(resetEmailConfigured()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://user:password@kan.example"); expect(recoveryOrigin()).toBeNull();
  });
});

describe("public recovery endpoint", () => {
  it("rejects malformed tokens and non-string passwords", () => {
    expect(validateResetPassword({ token: "bad", password: "valid-password" }).ok).toBe(false);
    expect(validateResetPassword({ token: newSessionToken(), password: 1234567890123 }).ok).toBe(false);
  });

  it("does not hash new passwords for an unknown token", async () => {
    const hash = vi.spyOn(passwords, "hashPassword");
    const store = { findPasswordResetToken: vi.fn(async () => null) } as unknown as PlatformStore;
    await expect(new PlatformService(store).resetPassword({ token: newSessionToken(), password: "new-fixture-password" })).rejects.toMatchObject({ code: "invalid_reset_token" });
    expect(hash).not.toHaveBeenCalled();
  });
  it("returns the same response for missing and existing accounts without exposing queue IDs", async () => {
    const requestPasswordReset = vi.fn().mockResolvedValueOnce({ ok: true, notificationId: "private-id" }).mockResolvedValueOnce({ ok: true });
    vi.spyOn(PlatformService, "create").mockReturnValue({ requestPasswordReset } as unknown as PlatformService);
    vi.spyOn(stores, "createPlatformStore").mockReturnValue({} as PlatformStore);
    vi.spyOn(email, "deliverResetEmail").mockResolvedValue();
    const req = () => new Request("https://kan.example/api/platform/password/forgot", { method: "POST", body: JSON.stringify({ email: "owner@example.invalid" }) });
    const first = await POST(req()), second = await POST(req());
    expect(first.status).toBe(200); expect(second.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true }); expect(await second.json()).toEqual({ ok: true });
    expect(waitUntil).toHaveBeenCalledOnce();
    expect(first.headers.get("cache-control")).toBe("no-store");
  });

  it("fails honestly for every account when the provider is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const create = vi.spyOn(PlatformService, "create");
    const response = await POST(new Request("https://kan.example/api/platform/password/forgot", { method: "POST", body: JSON.stringify({ email: "owner@example.invalid" }) }));
    expect(response.status).toBe(503); expect(await response.json()).toEqual({ error: "recovery_unavailable" });
    expect(create).not.toHaveBeenCalled();
  });
});
