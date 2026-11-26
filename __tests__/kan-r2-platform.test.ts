import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkQuota, planById, planAllows } from "../src/lib/platform/plans";
import { hasPermission, canAccessBusiness, canAccessShop } from "../src/lib/platform/access";
import { hashPassword, verifyPassword } from "../src/lib/platform/password";
import { hashSecret, newSessionToken } from "../src/lib/platform/tokens";
import { sanitizeMetadata } from "../src/lib/platform/audit";
import { validateSignup, validateInvite } from "../src/lib/platform/validation";
import { PlatformService, PlatformError } from "../src/lib/platform/service";
import type { PlatformStore, PlatformRecord } from "../src/lib/platform/store";

function fakeStore(): PlatformStore {
  const businesses = new Map<string, PlatformRecord>();
  const accounts = new Map<string, PlatformRecord>();
  const shops = new Map<string, PlatformRecord>();
  const sessions = new Map<string, PlatformRecord>();
  const resetTokens = new Map<string, PlatformRecord>();
  let plan = "basic";
  let nextId = 1;
  const record = (data: Record<string, unknown>): PlatformRecord => ({
    id: `r${nextId++}`,
    business_id: "biz1",
    ...data,
  });
  return {
    async transaction(work) { return work(this); },
    async createBusiness(input) {
      const biz = record({ name: input.name });
      businesses.set(biz.id, biz);
      return biz;
    },
    async findBusinessById(id) {
      return businesses.get(id) ?? null;
    },
    async findAccountByEmail(email) {
      return Array.from(accounts.values()).find((a) => a.email === email) ?? null;
    },
    async findAccountById(id) {
      return accounts.get(id) ?? null;
    },
    async createAccount(input) {
      const item = record({ ...input, password_hash: input.passwordHash, business_id: input.businessId, active: true });
      accounts.set(item.id, item);
      return item;
    },
    async updateAccountPassword(accountId, passwordHash) {
      const acc = accounts.get(accountId);
      if (acc) acc.password_hash = passwordHash;
    },
    async createShop(input) {
      const shop = record({
        name: input.name,
        business_id: input.businessId,
        shop_code: `S-${nextId}`,
        momo_number: input.momoNumber ?? "",
        currency: "UGX",
        active: true,
      });
      shops.set(shop.id, shop);
      return shop;
    },
    async listShopsByBusiness(businessId) {
      return Array.from(shops.values()).filter((s) => s.business_id === businessId);
    },
    async createSubscription() {
      return record({ plan });
    },
    async getSubscription() {
      return record({ plan });
    },
    async updateSubscription(_businessId, nextPlan) {
      plan = nextPlan;
    },
    async createSession(input) {
      sessions.set(input.tokenHash, record({ account_id: input.accountId, ...input }));
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
      resetTokens.set(
        input.tokenHash,
        record({ account_id: input.accountId, token_hash: input.tokenHash, expires_at: input.expiresAt })
      );
    },
    async findPasswordResetToken(tokenHash) {
      return resetTokens.get(tokenHash) ?? null;
    },
    async markPasswordResetTokenUsed(id) {
      const token = Array.from(resetTokens.values()).find((row) => row.id === id);
      if (!token || token.used_at || new Date(String(token.expires_at)) <= new Date()) return false;
      token.used_at = new Date(); return true;
    },
    async invalidatePasswordResetTokens(accountId) {
      for (const row of Array.from(resetTokens.values())) if (row.account_id === accountId && !row.used_at) row.used_at = new Date();
    },
    async countPasswordResetTokens() { return 0; },
    async findRecentResetEmail() { return null; },
    async findResetEmail() { return null; },
    async finishResetEmail() {},
    async cancelResetEmails() {},
    async countUsage(businessId) {
      const branchCount = Array.from(shops.values()).filter((s) => s.business_id === businessId).length;
      return { staff: accounts.size, branches: Math.max(branchCount, 1), skus: 0 };
    },
    async createAudit() {},
    async createNotification(input) { return { id: "notification", business_id: input.businessId, ...input }; },
  };
}

describe("Kan R2 — plans and permissions", () => {
  it("enforces plan quotas and features", () => {
    expect(checkQuota("basic", { staff: 0, branches: 0, skus: 0 }).allowed).toBe(true);
    expect(checkQuota("basic", { staff: 2, branches: 0, skus: 0 })).toEqual({
      allowed: false,
      reason: "staff_limit_reached",
    });
    expect(checkQuota("enterprise", { staff: 999, branches: 999, skus: 9999 }).allowed).toBe(true);
    expect(checkQuota("missing", { staff: 0, branches: 0, skus: 0 }).allowed).toBe(false);
    expect(planById("growth")?.skus).toBe(1000);
    expect(planAllows("basic", "store")).toBe(false);
    expect(planAllows("enterprise", "ai")).toBe(true);
  });

  it("grants least privilege", () => {
    expect(hasPermission("owner", "manage_billing")).toBe(true);
    expect(hasPermission("staff", "manage_billing")).toBe(false);
    expect(hasPermission("manager", "manage_stock")).toBe(true);
    expect(canAccessBusiness("owner", "a", "a")).toBe(true);
    expect(canAccessBusiness("owner", "a", "b")).toBe(false);
    expect(canAccessShop("staff", "a", "a", "s1", "s1")).toBe(true);
    expect(canAccessShop("staff", "a", "a", "s1", "s2")).toBe(false);
  });
});

describe("Kan R2 — credentials", () => {
  it("hashes passwords and verifies them in constant time", () => {
    const stored = hashPassword("correct horse battery");
    expect(verifyPassword("correct horse battery", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("never stores raw session tokens", () => {
    const token = newSessionToken();
    expect(hashSecret(token)).not.toBe(token);
    expect(hashSecret(token)).toHaveLength(64);
  });

  it("redacts secrets from audit metadata", () => {
    const safe = sanitizeMetadata({ password: "secret", token: "abc", plan: "growth" });
    expect(safe).toEqual({ plan: "growth" });
  });
});

describe("Kan R2 — validation", () => {
  it("rejects non-string signup fields and oversized credentials", () => {
    const body = { businessName: "Aisha Shop", shopName: "Entebbe", email: "aisha@example.com", password: "abcdefghij" };
    for (const key of Object.keys(body)) {
      expect(validateSignup({ ...body, [key]: { value: "forged" } }).ok).toBe(false);
    }
    expect(validateSignup({ ...body, password: "x".repeat(201) }).ok).toBe(false);
    expect(validateSignup({ ...body, shopName: "x".repeat(81) }).ok).toBe(false);
  });
  it("validates signup without trimming passwords", () => {
    const result = validateSignup({
      businessName: "Aisha Shop",
      shopName: "Nateete",
      email: " AISHA@EXAMPLE.COM ",
      password: "abcdefghij",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.email).toBe("aisha@example.com");
    expect(validateSignup({ businessName: "x", shopName: "y", email: "bad", password: "short" }).ok).toBe(false);
  });

  it("drops permissions beyond a role's grant", () => {
    const result = validateInvite(
      { email: "staff@example.com", role: "staff", permissions: ["sell", "manage_billing"] },
      ["sell", "manage_customers"]
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.permissions).toEqual(["sell"]);
  });
});

describe("Kan R2 — service boundaries", () => {
  let store: PlatformStore;
  let service: PlatformService;

  beforeEach(() => {
    store = fakeStore();
    service = new PlatformService(store);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a business, owner and subscription on signup", async () => {
    const result = await service.signup({
      businessName: "Aisha Shop",
      shopName: "Nateete",
      email: "aisha@example.com",
      password: "abcdefghij",
    });
    expect(result.account.role).toBe("owner");
    expect(result.token).toHaveLength(43);
    const ctx = await service.requireSession(result.token);
    expect(ctx.businessId).toBe(result.account.businessId);
  });

  it("resumes a matching registration but rejects another password", async () => {
    const body = {
      businessName: "Aisha Shop",
      shopName: "Nateete",
      email: "aisha@example.com",
      password: "abcdefghij",
    };
    const first = await service.signup(body);
    const resumed = await service.signup(body);
    expect(resumed.account.id).toBe(first.account.id);
    await expect(service.signup({ ...body, password: "another-password" })).rejects.toMatchObject({ code: "email_taken" });
  });

  it("does not leak which credential failed", async () => {
    await expect(
      service.login({ email: "nobody@example.com", password: "wrongpassword" })
    ).rejects.toMatchObject({ code: "invalid_credentials", status: 401 });
  });

  it("never returns another tenant workspace from an inconsistent context", async () => {
    const owner = await service.signup({ businessName: "Aisha Shop", shopName: "Entebbe", email: "owner@example.com", password: "abcdefghij" });
    const ctx = await service.requireSession(owner.token);
    const other = await store.createBusiness({ name: "Another tenant", ownerEmail: "other@example.com" });
    await expect(service.getWorkspace({ ...ctx, businessId: other.id })).rejects.toMatchObject({ status: 401 });
    expect((await service.getWorkspace(ctx)).shops).toHaveLength(1);
  });

  it("loads the onboarding summary without querying billing or usage", async () => {
    const owner = await service.signup({ businessName: "Aisha Shop", shopName: "Entebbe", email: "summary@example.com", password: "abcdefghij" });
    const ctx = await service.requireSession(owner.token);
    vi.spyOn(store, "countUsage").mockRejectedValue(new Error("unneeded_usage_query"));
    vi.spyOn(store, "getSubscription").mockRejectedValue(new Error("unneeded_billing_query"));
    const summary = await service.getWorkspace(ctx, true);
    expect(summary.business?.name).toBe("Aisha Shop");
    expect(summary.shops).toHaveLength(1);
    expect(summary).not.toHaveProperty("usage");
    expect(summary).not.toHaveProperty("subscription");
  });

  it("blocks staff from billing", async () => {
    const account = await store.createAccount({
      businessId: "biz1",
      email: "staff@example.com",
      passwordHash: hashPassword("abcdefghij"),
      role: "staff",
    });
    const ctx = { accountId: account.id, businessId: "biz1", role: "staff" };
    await expect(service.changePlan(ctx, "biz1", { plan: "growth" })).rejects.toBeInstanceOf(
      PlatformError
    );
  });
});
