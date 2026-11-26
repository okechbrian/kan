import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PlatformService } from "../src/lib/platform/service";
import { createPlatformStore, type PlatformStore } from "../src/lib/platform/store";
import { hashSecret } from "../src/lib/platform/tokens";

describe.skipIf(process.env.KAN_RECOVERY_INTEGRATION !== "1")("isolated Postgres account recovery", () => {
  const run = randomUUID();
  const names: string[] = [];
  let prisma: PrismaClient, store: PlatformStore, service: PlatformService;
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://kan.example");
    const connection = new URL(process.env.DATABASE_URL!);
    connection.searchParams.set("connect_timeout", "20");
    connection.searchParams.set("pool_timeout", "20");
    connection.searchParams.set("connection_limit", "2");
    prisma = new PrismaClient({ datasources: { db: { url: connection.toString() } } });
    await prisma.$connect();
    store = createPlatformStore(prisma); service = new PlatformService(store);
  }, 60000);
  async function fixture(label: string) {
    const businessName = `recovery-audit-${run}-${label}`; names.push(businessName);
    const body = { businessName, shopName: "Recovery Test", email: `${businessName}@example.invalid`, password: "old-fixture-password" };
    const owner = await service.signup(body);
    return { body, owner };
  }
  async function request(email: string) {
    const response = await service.requestPasswordReset({ email });
    const notification = await store.findResetEmail(response.notificationId!);
    const token = new URL(String(notification!.body).split(" ").at(-1)!).searchParams.get("token")!;
    return { response, notification: notification!, token };
  }
  afterAll(async () => {
    if (!prisma) return;
    try {
      const businesses = await prisma.business.findMany({ where: { name: { in: names } }, select: { id: true } });
      const ids = businesses.map((row) => row.id);
      await prisma.$transaction(async (tx) => {
        await tx.auditEvent.deleteMany({ where: { business_id: { in: ids } } });
        await tx.notification.deleteMany({ where: { business_id: { in: ids } } });
        await tx.account.deleteMany({ where: { business_id: { in: ids } } });
        await tx.subscription.deleteMany({ where: { business_id: { in: ids } } });
        await tx.shop.deleteMany({ where: { business_id: { in: ids } } });
        await tx.business.deleteMany({ where: { id: { in: ids } } });
      }, { maxWait: 10000, timeout: 120000 });
      expect(await prisma.business.count({ where: { name: { in: names } } })).toBe(0);
    } finally { await prisma.$disconnect(); vi.unstubAllEnvs(); }
  }, 180000);

  it("limits repeated requests and supersedes older links atomically", async () => {
    const { body, owner } = await fixture("supersession");
    const first = await request(body.email);
    const second = await service.requestPasswordReset({ email: body.email });
    expect(second.notificationId).toBe(first.response.notificationId);
    expect(await prisma.passwordResetToken.count({ where: { account_id: owner.account.id } })).toBe(1);
    await prisma.notification.update({ where: { id: first.notification.id }, data: { created_at: new Date(Date.now() - 61000) } });
    const newer = await request(body.email);
    expect(newer.response.notificationId).not.toBe(first.response.notificationId);
    await expect(service.resetPassword({ token: first.token, password: "new-fixture-password" })).rejects.toMatchObject({ code: "invalid_reset_token" });
    expect((await store.findResetEmail(first.notification.id))?.body).toBe("");
    await service.resetPassword({ token: newer.token, password: "new-fixture-password" });
  }, 180000);

  it("only one concurrent redemption succeeds and all existing sessions are revoked", async () => {
    const { body, owner } = await fixture("single-use");
    const extra = await service.login({ email: body.email, password: body.password });
    const reset = await request(body.email);
    const passwords = ["new-password-fixture-a", "new-password-fixture-b"];
    const results = await Promise.allSettled(passwords.map((password) => service.resetPassword({ token: reset.token, password })));
    expect(results.filter((row) => row.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((row) => row.status === "rejected")).toHaveLength(1);
    const winner = results.findIndex((row) => row.status === "fulfilled");
    await expect(service.requireSession(owner.token)).rejects.toMatchObject({ status: 401 });
    await expect(service.requireSession(extra.token)).rejects.toMatchObject({ status: 401 });
    await expect(service.login({ email: body.email, password: body.password })).rejects.toMatchObject({ status: 401 });
    expect((await service.login({ email: body.email, password: passwords[winner] })).account.id).toBe(owner.account.id);
    await expect(service.resetPassword({ token: reset.token, password: "cannot-reuse-password" })).rejects.toMatchObject({ code: "invalid_reset_token" });
    expect((await store.findResetEmail(reset.notification.id))?.body).toBe("");
  }, 180000);

  it("failed password writes roll back token consumption and session revocation", async () => {
    const { body, owner } = await fixture("rollback");
    const reset = await request(body.email);
    const failing: PlatformStore = { ...store, transaction<T>(work: (tx: PlatformStore) => Promise<T>) {
      return store.transaction((tx) => work({ ...tx, async updateAccountPassword() { throw new Error("injected_password_failure"); } }));
    } };
    await expect(new PlatformService(failing).resetPassword({ token: reset.token, password: "new-fixture-password" })).rejects.toThrow("injected_password_failure");
    expect((await store.findPasswordResetToken(hashSecret(reset.token)))?.used_at).toBeNull();
    expect((await service.requireSession(owner.token)).accountId).toBe(owner.account.id);
    await service.resetPassword({ token: reset.token, password: "new-fixture-password" });
  }, 180000);

  it("rejects expired links and caps requests at five per hour", async () => {
    const { body, owner } = await fixture("expiry");
    const reset = await request(body.email);
    await prisma.passwordResetToken.updateMany({ where: { account_id: owner.account.id }, data: { expires_at: new Date(Date.now() - 1) } });
    await expect(service.resetPassword({ token: reset.token, password: "new-fixture-password" })).rejects.toMatchObject({ code: "invalid_reset_token" });
    await prisma.notification.update({ where: { id: reset.notification.id }, data: { created_at: new Date(Date.now() - 61000) } });
    await prisma.passwordResetToken.createMany({ data: Array.from({ length: 4 }, () => ({ id: randomUUID(), account_id: owner.account.id, token_hash: hashSecret(randomUUID()), expires_at: new Date(Date.now() + 3600000) })) });
    expect(await service.requestPasswordReset({ email: body.email })).toEqual({ ok: true });
    expect(await prisma.passwordResetToken.count({ where: { account_id: owner.account.id } })).toBe(5);
  }, 180000);

  it("queue failure rolls back issuance and preserves the earlier valid reset", async () => {
    const { body, owner } = await fixture("issuance-rollback");
    const first = await request(body.email);
    await prisma.notification.update({ where: { id: first.notification.id }, data: { created_at: new Date(Date.now() - 61000) } });
    const failing: PlatformStore = { ...store, transaction<T>(work: (tx: PlatformStore) => Promise<T>) {
      return store.transaction((tx) => work({ ...tx, async createNotification() { throw new Error("injected_queue_failure"); } }));
    } };
    await expect(new PlatformService(failing).requestPasswordReset({ email: body.email })).rejects.toThrow("injected_queue_failure");
    expect((await store.findPasswordResetToken(hashSecret(first.token)))?.used_at).toBeNull();
    expect((await store.findResetEmail(first.notification.id))?.status).toBe("pending");
    expect(await prisma.passwordResetToken.count({ where: { account_id: owner.account.id } })).toBe(1);
    await service.resetPassword({ token: first.token, password: "new-fixture-password" });
  }, 180000);
});
