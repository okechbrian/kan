import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PlatformService } from "../src/lib/platform/service";
import { createPlatformStore } from "../src/lib/platform/store";
import { pairCloudBranch } from "../src/lib/platform/pairing";
import { verifyPin } from "../src/lib/pin";
import * as database from "../src/lib/server-db";
import { POST } from "../src/app/api/platform/pair/route";
import { GET as pull } from "../src/app/api/sync/route";

describe.skipIf(process.env.KAN_PAIRING_INTEGRATION !== "1")("cloud branch pairing in Postgres", () => {
  let db: PrismaClient;
  const prefix = `pairing-${randomUUID()}`;
  const names = [`${prefix}-a`, `${prefix}-b`];
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const connection = new URL(process.env.DATABASE_URL!);
    connection.searchParams.set("connect_timeout", "20"); connection.searchParams.set("pool_timeout", "20"); connection.searchParams.set("connection_limit", "2");
    db = new PrismaClient({ datasources: { db: { url: connection.toString() } } });
    await db.$connect(); vi.spyOn(database, "getServerDb").mockReturnValue(db);
  }, 60000);
  afterAll(async () => {
    if (!db) return;
    try {
      const businesses = await db.business.findMany({ where: { name: { in: names } }, select: { id: true } });
      const ids = businesses.map((row) => row.id);
      const shops = await db.shop.findMany({ where: { business_id: { in: ids } }, select: { id: true } });
      const shopIds = shops.map((row) => row.id);
      await db.$transaction(async (tx) => {
        await tx.stockMovement.deleteMany({ where: { shop_id: { in: shopIds } } });
        await tx.product.deleteMany({ where: { shop_id: { in: shopIds } } });
        await tx.device.deleteMany({ where: { shop_id: { in: shopIds } } });
        await tx.user.deleteMany({ where: { business_id: { in: ids } } });
        await tx.auditEvent.deleteMany({ where: { business_id: { in: ids } } });
        await tx.account.deleteMany({ where: { business_id: { in: ids } } });
        await tx.subscription.deleteMany({ where: { business_id: { in: ids } } });
        await tx.shop.deleteMany({ where: { id: { in: shopIds } } });
        await tx.business.deleteMany({ where: { id: { in: ids } } });
      }, { timeout: 120000 });
      expect(await db.business.count({ where: { name: { in: names } } })).toBe(0);
    } finally { await db.$disconnect(); vi.restoreAllMocks(); }
  }, 180000);

  it("pairs existing IDs, resumes lost responses and denies wrong tenants/PIN/device rebinding", async () => {
    const service = new PlatformService(createPlatformStore(db));
    const owner = await service.signup({ businessName: names[0], shopName: "Main", email: `${names[0]}@example.invalid`, password: "pairing-fixture-password" });
    const other = await service.signup({ businessName: names[1], shopName: "Other", email: `${names[1]}@example.invalid`, password: "pairing-fixture-password" });
    const ctx = await service.requireSession(owner.token), otherCtx = await service.requireSession(other.token);
    const shop = await db.shop.findFirstOrThrow({ where: { business_id: ctx.businessId } });
    const foreign = await db.shop.findFirstOrThrow({ where: { business_id: otherCtx.businessId } });
    const branch2 = await db.shop.create({ data: { id: randomUUID(), business_id: ctx.businessId, name: "Second", shop_code: randomUUID() } });
    const input = { shopId: shop.id, deviceId: randomUUID(), pin: "5678" };
    const paired = await pairCloudBranch(db, ctx, input);
    expect(paired.business.id).toBe(ctx.businessId); expect(paired.rows.shops[0].id).toBe(shop.id);
    expect(await verifyPin("5678", paired.rows.users[0].pin_hash)).toBe(true);
    const retry = await pairCloudBranch(db, ctx, input);
    expect(retry.device.token).toBe(paired.device.token);
    expect(await db.device.count({ where: { shop_id: shop.id } })).toBe(1);
    expect(await db.user.count({ where: { business_id: ctx.businessId, role: "owner" } })).toBe(1);
    await expect(pairCloudBranch(db, ctx, { ...input, pin: "0000" })).rejects.toMatchObject({ code: "invalid_owner_pin" });
    await expect(pairCloudBranch(db, ctx, { ...input, shopId: foreign.id })).rejects.toMatchObject({ status: 404 });
    await expect(pairCloudBranch(db, { ...ctx, role: "staff" }, input)).rejects.toMatchObject({ status: 403 });
    await expect(pairCloudBranch(db, ctx, { ...input, shopId: branch2.id })).rejects.toMatchObject({ code: "device_already_bound" });
    const second = await pairCloudBranch(db, ctx, { ...input, shopId: branch2.id, deviceId: randomUUID() });
    expect(second.owner_id).toBe(paired.owner_id);
    expect(second.rows.shops.map((row) => row.id)).toEqual([branch2.id]);
    expect(await db.business.count({ where: { name: { in: names } } })).toBe(2);
    expect(await db.shop.count({ where: { business_id: ctx.businessId } })).toBe(2);
    const response = await POST(new Request("https://kan.test/api/platform/pair", { method: "POST", headers: { cookie: `kan_session=${owner.token}` }, body: JSON.stringify(input) }));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store");
    const snapshot = await pull(new Request("https://kan.test/api/sync", { headers: { authorization: `Bearer ${paired.device.token}` } }));
    expect(snapshot.status).toBe(200); expect((await snapshot.json()).shop_id).toBe(shop.id);
    expect((await POST(new Request("https://kan.test/api/platform/pair", { method: "POST", body: JSON.stringify(input) }))).status).toBe(401);
  }, 300000);
});
