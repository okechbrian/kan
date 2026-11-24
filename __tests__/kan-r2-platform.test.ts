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
  const accounts = new Map<string, PlatformRecord>();
  const sessions = new Map<string, PlatformRecord>();
  let nextId = 1;
  const record = (data: Record<string, unknown>): PlatformRecord => ({
    id: `r${nextId++}`,
    business_id: "biz1",
    ...data,
  });
  return {
    async createBusiness(input) {
      return record({ name: input.name });
    },
    async findAccountByEmail(email) {
      return Array.from(accounts.values()).find((a) => a.email === email) ?? null;
    },
    async findAccountById(id) {
      return accounts.get(id) ?? null;
    },
    async createAccount(input) {
      const item = record({ ...input, active: true });
      accounts.set(item.id, item);
      return item;
    },
    async createShop(input) {
      return record({ name: input.name, shop_code: `S-${nextId}`, active: true });
    },
    async createSubscription() {
      return record({ plan: "basic" });
    },
    async getSubscription() {
      return record({ plan: "basic" });
    },
    async updateSubscription() {},
    async createSession(input) {
      sessions.set(input.tokenHash, record({ account_id: input.accountId, ...input }));
    },
    async findSessionByToken(tokenHash) {
      return sessions.get(tokenHash) ?? null;
    },
    async revokeSession() {},
    async countUsage() {
      return { staff: accounts.size, branches: 1, skus: 0 };
    },
    async createAudit() {},
    async createNotification() {},
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
    expect(ctx.businessId).toBe("biz1");
  });

  it("rejects duplicate emails", async () => {
    const body = {
      businessName: "Aisha Shop",
      shopName: "Nateete",
      email: "aisha@example.com",
      password: "abcdefghij",
    };
    await service.signup(body);
    await expect(service.signup(body)).rejects.toMatchObject({ code: "email_taken" });
  });

  it("does not leak which credential failed", async () => {
    await expect(
      service.login({ email: "nobody@example.com", password: "wrongpassword" })
    ).rejects.toMatchObject({ code: "invalid_credentials", status: 401 });
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
