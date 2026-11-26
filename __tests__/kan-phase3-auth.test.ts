import { describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { hashPassword } from "../src/lib/platform/password";
import { PlatformService } from "../src/lib/platform/service";
import type { PlatformRecord, PlatformStore } from "../src/lib/platform/store";
import { hashSecret } from "../src/lib/platform/tokens";

function makeMemoryStore(): PlatformStore {
  const businesses = new Map<string, PlatformRecord>();
  const accounts = new Map<string, PlatformRecord>();
  const shops = new Map<string, PlatformRecord>();
  const subscriptions = new Map<string, PlatformRecord>();
  const sessions = new Map<string, PlatformRecord>();
  const resets = new Map<string, PlatformRecord>();
  let seq = 1;
  const id = (prefix: string) => `${prefix}-${seq++}`;

  return {
    async createBusiness(input) {
      const bid = id("biz");
      const rec: PlatformRecord = { id: bid, business_id: bid, name: input.name };
      businesses.set(bid, rec);
      return rec;
    },
    async findBusinessById(bid) {
      return businesses.get(bid) ?? null;
    },
    async findAccountByEmail(email) {
      return Array.from(accounts.values()).find((a) => a.email === email) ?? null;
    },
    async findAccountById(aid) {
      return accounts.get(aid) ?? null;
    },
    async createAccount(input) {
      const aid = id("acc");
      const rec: PlatformRecord = {
        id: aid,
        business_id: input.businessId,
        email: input.email,
        password_hash: input.passwordHash,
        role: input.role,
        active: true,
      };
      accounts.set(aid, rec);
      return rec;
    },
    async updateAccountPassword(accountId, passwordHash) {
      const acc = accounts.get(accountId);
      if (acc) acc.password_hash = passwordHash;
    },
    async createShop(input) {
      const sid = id("shop");
      const rec: PlatformRecord = {
        id: sid,
        business_id: input.businessId,
        name: input.name,
        shop_code: `KAN-${seq}`,
        momo_number: input.momoNumber ?? "",
        currency: "UGX",
        active: true,
      };
      shops.set(sid, rec);
      return rec;
    },
    async listShopsByBusiness(businessId) {
      return Array.from(shops.values()).filter((s) => s.business_id === businessId);
    },
    async createSubscription(businessId) {
      const sid = id("sub");
      const rec: PlatformRecord = { id: sid, business_id: businessId, plan: "basic", status: "trialing" };
      subscriptions.set(businessId, rec);
      return rec;
    },
    async getSubscription(businessId) {
      return subscriptions.get(businessId) ?? null;
    },
    async updateSubscription(businessId, plan) {
      const sub = subscriptions.get(businessId);
      if (sub) sub.plan = plan;
    },
    async createSession(input) {
      const sid = id("sess");
      sessions.set(input.tokenHash, {
        id: sid,
        business_id: "",
        account_id: input.accountId,
        token_hash: input.tokenHash,
        expires_at: input.expiresAt,
      });
    },
    async findSessionByToken(tokenHash) {
      return sessions.get(tokenHash) ?? null;
    },
    async revokeSession(sessionId) {
      for (const s of Array.from(sessions.values())) {
        if (s.id === sessionId) s.revoked_at = new Date();
      }
    },
    async revokeAllSessionsForAccount(accountId) {
      for (const s of Array.from(sessions.values())) {
        if (s.account_id === accountId) s.revoked_at = new Date();
      }
    },
    async createPasswordResetToken(input) {
      const rid = id("rst");
      resets.set(input.tokenHash, {
        id: rid,
        business_id: "",
        account_id: input.accountId,
        token_hash: input.tokenHash,
        expires_at: input.expiresAt,
      });
    },
    async findPasswordResetToken(tokenHash) {
      return resets.get(tokenHash) ?? null;
    },
    async markPasswordResetTokenUsed(rid) {
      for (const r of Array.from(resets.values())) {
        if (r.id === rid) r.used_at = new Date();
      }
    },
    async countUsage(businessId) {
      return {
        staff: Array.from(accounts.values()).filter((a) => a.business_id === businessId).length,
        branches: Array.from(shops.values()).filter((s) => s.business_id === businessId).length,
        skus: 0,
      };
    },
    async createAudit() {},
    async createNotification() {},
  };
}

describe("Kan Phase 3 — password reset, branch quotas & routes", () => {
  it("completes password reset, revokes old sessions, and rejects token reuse or expiry", async () => {
    const store = makeMemoryStore();
    const service = new PlatformService(store);

    const signup = await service.signup({
      businessName: "Kiwafu Mart",
      shopName: "Entebbe Main",
      email: "owner@kiwafu.ug",
      password: "old-strong-password",
    });

    const notification = vi.spyOn(store, "createNotification");
    const resetReq = await service.requestPasswordReset({ email: "owner@kiwafu.ug" });
    expect(resetReq.ok).toBe(true);
    expect(resetReq).not.toHaveProperty("resetToken");
    const delivered = notification.mock.calls[0][0].body;
    const token = new URL(delivered.split(" ").at(-1)!).searchParams.get("token")!;
    expect(token).toBeTruthy();
    await service.resetPassword({ token, password: "new-strong-password" });

    // Old session must be revoked
    await expect(service.requireSession(signup.token)).rejects.toMatchObject({
      code: "unauthorized",
    });

    // Old password rejected, new password accepted
    await expect(
      service.login({ email: "owner@kiwafu.ug", password: "old-strong-password" }),
    ).rejects.toMatchObject({ code: "invalid_credentials" });

    const loggedIn = await service.login({
      email: "owner@kiwafu.ug",
      password: "new-strong-password",
    });
    expect(loggedIn.account.email).toBe("owner@kiwafu.ug");

    // Token reuse rejected
    await expect(
      service.resetPassword({ token, password: "another-password-123" }),
    ).rejects.toMatchObject({ code: "invalid_reset_token" });

    // Expired token rejected
    await store.createPasswordResetToken({
      accountId: signup.account.id,
      tokenHash: hashSecret("expired-token"),
      expiresAt: new Date(Date.now() - 60_000),
    });
    await expect(
      service.resetPassword({ token: "expired-token", password: "another-password-123" }),
    ).rejects.toMatchObject({ code: "invalid_reset_token" });
  });

  it("enforces branch quotas per plan and isolates businesses", async () => {
    const store = makeMemoryStore();
    const service = new PlatformService(store);

    const bizA = await service.signup({
      businessName: "Shop Alpha",
      shopName: "Branch 1",
      email: "a@shop.ug",
      password: "password1234",
    });
    const ctxA = await service.requireSession(bizA.token);

    // Basic plan allows 1 branch (created during signup), so adding a 2nd fails
    await expect(service.createBranch(ctxA, { name: "Branch 2" })).rejects.toMatchObject({
      code: "branches_limit_reached",
      status: 409,
    });

    // Upgrade to Growth (2 branches) -> 2nd branch succeeds
    await service.changePlan(ctxA, ctxA.businessId, { plan: "growth" });
    const branch2 = await service.createBranch(ctxA, {
      name: "Branch 2",
      momoNumber: "0791149592",
    });
    expect(branch2.name).toBe("Branch 2");
    expect(branch2.shop_code).toBeTruthy();

    const workspace = await service.getWorkspace(ctxA);
    expect(workspace.shops).toHaveLength(2);

    // Cross-tenant isolation: Business B cannot access Business A
    const bizB = await store.createBusiness({ name: "Shop Beta", ownerEmail: "b@shop.ug" });
    const accB = await store.createAccount({
      businessId: bizB.id,
      email: "b@shop.ug",
      passwordHash: hashPassword("password1234"),
      role: "owner",
    });
    const ctxB = { accountId: accB.id, businessId: bizB.id, role: "owner" };
    await expect(service.changePlan(ctxB, ctxA.businessId, { plan: "basic" })).rejects.toMatchObject({
      code: "forbidden",
      status: 403,
    });
  });

  it("has all Phase 3 auth and branch routes", () => {
    const root = process.cwd();
    const paths = [
      "src/app/api/platform/password/forgot/route.ts",
      "src/app/api/platform/password/reset/route.ts",
      "src/app/api/platform/workspace/route.ts",
      "src/app/api/platform/branches/route.ts",
      "src/app/app/forgot-password/page.tsx",
      "src/app/app/reset-password/page.tsx",
      "src/app/app/business/branch/page.tsx",
      "src/app/app/business/create/page.tsx",
    ];
    for (const rel of paths) {
      expect(existsSync(join(root, rel))).toBe(true);
    }
  });
});
