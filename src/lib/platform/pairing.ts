import { randomBytes, randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { hashPin, verifyPin } from "../pin";
import { readShopSnapshot, SYNC_TRANSACTION_OPTIONS } from "../server-sync";
import { PlatformError, type SessionContext } from "./service";

export async function pairCloudBranch(db: PrismaClient, ctx: SessionContext, body: unknown) {
  if (ctx.role !== "owner") throw new PlatformError("forbidden", 403);
  const input = body as Record<string, unknown> | null;
  if (!input || typeof input.shopId !== "string" || typeof input.deviceId !== "string" ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.deviceId) || typeof input.pin !== "string" || !/^\d{4,6}$/.test(input.pin)) throw new PlatformError("invalid_pairing", 400);
  const { shopId, deviceId, pin } = input as { shopId: string; deviceId: string; pin: string };
  const pinHash = await hashPin(pin);
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const account = await tx.account.findUnique({ where: { id: ctx.accountId } });
        if (!account?.active || account.role !== "owner" || account.business_id !== ctx.businessId) throw new PlatformError("forbidden", 403);
        const shop = await tx.shop.findFirst({ where: { id: shopId, business_id: ctx.businessId, active: true } });
        if (!shop) throw new PlatformError("branch_not_found", 404);
        const owners = await tx.user.findMany({ where: { business_id: ctx.businessId, role: "owner" }, orderBy: { id: "asc" } });
        let owner = null;
        for (const candidate of owners) if (candidate.active && await verifyPin(pin, candidate.pin_hash)) { owner = candidate; break; }
        if (owners.length && !owner) throw new PlatformError("invalid_owner_pin", 403);
        if (!owner) owner = await tx.user.create({ data: { id: randomUUID(), business_id: ctx.businessId, shop_id: null, role: "owner", name: "Owner", pin_hash: pinHash } });
        // Owner permission is business-wide; its offline branch comes from the device binding.
        if (owner.shop_id) owner = await tx.user.update({ where: { id: owner.id }, data: { shop_id: null } });
        let device = await tx.device.findUnique({ where: { id: deviceId } });
        if (device && device.shop_id !== shopId) throw new PlatformError("device_already_bound", 409);
        if (!device) device = await tx.device.create({ data: { id: deviceId, shop_id: shopId, token: randomBytes(32).toString("hex"), name: "Cloud branch till" } });
        const business = await tx.business.findUniqueOrThrow({ where: { id: ctx.businessId } });
        const rows = await readShopSnapshot(tx, { shopId, businessId: business.id });
        return { protocol: 2, business, shop_id: shopId, owner_id: owner.id, device, rows, new_cursor: new Date().toISOString() };
      }, SYNC_TRANSACTION_OPTIONS);
    } catch (error) {
      if (attempt < 2 && typeof error === "object" && error !== null && "code" in error && ["P2034", "P2002"].includes(String(error.code))) continue;
      throw error;
    }
  }
}
