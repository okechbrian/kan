import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createPlatformStore, type PlatformStore } from "../src/lib/platform/store";
import { PlatformService } from "../src/lib/platform/service";
import { hashPassword } from "../src/lib/platform/password";
import * as database from "../src/lib/server-db";
import { POST as signupRoute } from "../src/app/api/platform/signup/route";
import { GET as workspaceRoute } from "../src/app/api/platform/workspace/route";

// Only generated tenants are created/removed. Default CI never touches a cloud DB.
describe.skipIf(process.env.KAN_ONBOARDING_INTEGRATION !== "1")("owner onboarding in Postgres", () => {
  const run = randomUUID();
  const input = (label: string) => ({ businessName: `onboarding-${run}-${label}`, shopName: "Entebbe Main", email: `onboarding-${run}-${label}@example.invalid`, password: `Test-${randomUUID()}` });
  const a = input("a"), b = input("b"), failed = input("failed"), legacy = input("legacy");
  const names = [a, b, failed, legacy].map((item) => item.businessName);
  let prisma: PrismaClient;
  let store: PlatformStore;
  let service: PlatformService;

  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    prisma = new PrismaClient();
    vi.spyOn(database, "getServerDb").mockReturnValue(prisma);
    store = createPlatformStore(prisma);
    service = new PlatformService(store);
  });

  afterAll(async () => {
    if (!prisma) return;
    try {
      const businesses = await prisma.business.findMany({ where: { name: { in: names } }, select: { id: true } });
      const ids = businesses.map((item) => item.id);
      await prisma.$transaction(async (tx) => {
        await tx.auditEvent.deleteMany({ where: { business_id: { in: ids } } });
        await tx.notification.deleteMany({ where: { business_id: { in: ids } } });
        await tx.account.deleteMany({ where: { business_id: { in: ids } } });
        await tx.subscription.deleteMany({ where: { business_id: { in: ids } } });
        await tx.shop.deleteMany({ where: { business_id: { in: ids } } });
        await tx.business.deleteMany({ where: { id: { in: ids } } });
      }, { timeout: 30000 });
      expect(await prisma.business.count({ where: { name: { in: names } } })).toBe(0);
      expect(await prisma.account.count({ where: { email: { in: [a, b, failed, legacy].map((x) => x.email) } } })).toBe(0);
    } finally { await prisma.$disconnect(); vi.restoreAllMocks(); }
  }, 180000);

  it("rolls back business, account, branch and subscription if session preparation fails", async () => {
    const failing: PlatformStore = {
      ...store,
      transaction<T>(work: (tx: PlatformStore) => Promise<T>) {
        return store.transaction((tx) => work({ ...tx, async createSession() { throw new Error("injected_session_failure"); } }));
      },
    };
    await expect(new PlatformService(failing).signup(failed)).rejects.toThrow("injected_session_failure");
    expect(await prisma.business.count({ where: { name: failed.businessName } })).toBe(0);
    expect(await prisma.account.count({ where: { email: failed.email } })).toBe(0);
    const retry = await service.signup(failed);
    expect((await service.getWorkspace(await service.requireSession(retry.token))).shops).toHaveLength(1);
  }, 180000);

  it("concurrent/lost-response retries create one workspace; separate owners stay isolated", async () => {
    const [first, replay, other] = await Promise.all([service.signup(a), service.signup(a), service.signup(b)]);
    expect(replay.account.id).toBe(first.account.id);
    const resumed = await service.signup(a);
    expect(resumed.account.id).toBe(first.account.id);
    const ctxA = await service.requireSession(first.token), ctxB = await service.requireSession(other.token);
    const [workspaceA, workspaceB] = await Promise.all([service.getWorkspace(ctxA), service.getWorkspace(ctxB)]);
    expect(workspaceA.business?.name).toBe(a.businessName);
    expect(workspaceB.business?.name).toBe(b.businessName);
    expect(workspaceA.shops).toHaveLength(1);
    expect(workspaceA.shops[0].id).not.toBe(workspaceB.shops[0].id);
    expect(workspaceA.shops[0].currency).toBe("UGX");
    expect(await prisma.business.count({ where: { name: a.businessName } })).toBe(1);
    expect(await prisma.subscription.count({ where: { business_id: ctxA.businessId } })).toBe(1);
    await expect(service.getWorkspace({ ...ctxA, businessId: ctxB.businessId })).rejects.toMatchObject({ status: 401 });
    await expect(service.requireBusiness(first.token, ctxB.businessId)).rejects.toMatchObject({ status: 403 });
    await expect(service.signup({ ...a, password: "wrong-password-123" })).rejects.toMatchObject({ status: 409 });
    const login = await service.login({ email: a.email.toUpperCase(), password: a.password });
    expect(login.account.id).toBe(first.account.id);
    await service.logout(login.token, await service.requireSession(login.token));
    await expect(service.requireSession(login.token)).rejects.toMatchObject({ status: 401 });
  }, 180000);

  it("resumes a legacy owner missing a first branch without duplicate branches", async () => {
    const business = await store.createBusiness({ name: legacy.businessName, ownerEmail: legacy.email });
    await store.createAccount({ businessId: business.id, email: legacy.email, passwordHash: hashPassword(legacy.password), role: "owner" });
    const [first, replay] = await Promise.all([service.signup(legacy), service.signup(legacy)]);
    expect(first.account.id).toBe(replay.account.id);
    expect(await prisma.shop.count({ where: { business_id: business.id } })).toBe(1);
    expect(await prisma.subscription.count({ where: { business_id: business.id } })).toBe(1);
  }, 180000);

  it("sets an HttpOnly session and returns a private workspace without leaking hashes", async () => {
    const response = await signupRoute(new Request("https://kan.test/api/platform/signup", { method: "POST", body: JSON.stringify(b) }));
    expect(response.status).toBe(201);
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    const body = await response.json();
    expect(body.token).toBeUndefined();
    expect(body.account.password_hash).toBeUndefined();
    const workspace = await workspaceRoute(new Request("https://kan.test/api/platform/workspace", { headers: { cookie: cookie.split(";")[0] } }));
    expect(workspace.status).toBe(200);
    expect(workspace.headers.get("cache-control")).toContain("no-store");
    expect((await workspace.json()).business.name).toBe(b.businessName);
    expect((await workspaceRoute(new Request("https://kan.test/api/platform/workspace"))).status).toBe(401);
  }, 180000);
});
