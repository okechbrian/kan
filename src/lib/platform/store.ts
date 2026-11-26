import { randomUUID } from "node:crypto";
import type { AuditAction } from "./audit";
import { hashSecret } from "./tokens";
import { getServerDb } from "../server-db";
import type { Prisma, PrismaClient } from "@prisma/client";

type Actor = { businessId: string; accountId?: string };

export type PlatformRecord = {
  id: string;
  business_id: string;
  [key: string]: unknown;
};

export type PlatformStore = {
  transaction<T>(work: (store: PlatformStore) => Promise<T>): Promise<T>;
  createBusiness(input: { name: string; ownerEmail: string }): Promise<PlatformRecord>;
  findBusinessById(id: string): Promise<PlatformRecord | null>;
  findAccountByEmail(email: string): Promise<PlatformRecord | null>;
  findAccountById(id: string): Promise<PlatformRecord | null>;
  createAccount(input: {
    businessId: string;
    email: string;
    passwordHash: string;
    role: string;
  }): Promise<PlatformRecord>;
  updateAccountPassword(accountId: string, passwordHash: string): Promise<void>;
  createShop(input: {
    businessId: string;
    name: string;
    momoNumber?: string;
  }): Promise<PlatformRecord>;
  listShopsByBusiness(businessId: string): Promise<PlatformRecord[]>;
  createSubscription(businessId: string): Promise<PlatformRecord>;
  getSubscription(businessId: string): Promise<PlatformRecord | null>;
  updateSubscription(businessId: string, plan: string): Promise<void>;
  createSession(input: {
    accountId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findSessionByToken(tokenHash: string): Promise<PlatformRecord | null>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllSessionsForAccount(accountId: string): Promise<void>;
  createPasswordResetToken(input: {
    accountId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findPasswordResetToken(tokenHash: string): Promise<PlatformRecord | null>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
  countUsage(businessId: string): Promise<{ staff: number; branches: number; skus: number }>;
  createAudit(input: {
    actor: Actor;
    action: AuditAction;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  createNotification(input: {
    businessId: string;
    channel: string;
    recipient: string;
    subject: string;
    body: string;
  }): Promise<void>;
};

function requirePrisma() {
  const prisma = getServerDb();
  if (!prisma) throw new Error("Database not configured");
  return prisma;
}

export function createPlatformStore(db: PrismaClient | Prisma.TransactionClient = requirePrisma()): PlatformStore {
  const toRecord = (value: unknown): PlatformRecord => value as PlatformRecord;

  return {
    async transaction(work) {
      if (!("$transaction" in db)) throw new Error("Nested platform transaction");
      return db.$transaction((tx) => work(createPlatformStore(tx)), { timeout: 30000, isolationLevel: "Serializable" });
    },
    async createBusiness(input) {
      return toRecord(
        await db.business.create({
          data: { id: randomUUID(), name: input.name },
        })
      );
    },
    async findBusinessById(id) {
      const row = await db.business.findUnique({ where: { id } });
      return row ? { ...row, business_id: row.id } : null;
    },
    async findAccountByEmail(email) {
      return toRecord(await db.account.findUnique({ where: { email } }));
    },
    async findAccountById(id) {
      return toRecord(await db.account.findUnique({ where: { id } }));
    },
    async createAccount(input) {
      return toRecord(
        await db.account.create({
          data: {
            id: randomUUID(),
            business_id: input.businessId,
            email: input.email,
            password_hash: input.passwordHash,
            role: input.role,
          },
        })
      );
    },
    async updateAccountPassword(accountId, passwordHash) {
      await db.account.update({
        where: { id: accountId },
        data: { password_hash: passwordHash },
      });
    },
    async createShop(input) {
      const code = `${input.name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "SHOP"}-${randomUUID()
        .replace(/-/g, "")
        .slice(0, 4)
        .toUpperCase()}`;
      return toRecord(
        await db.shop.create({
          data: {
            id: randomUUID(),
            business_id: input.businessId,
            name: input.name,
            shop_code: code,
            momo_number: input.momoNumber ?? "",
            currency: "UGX",
          },
        })
      );
    },
    async listShopsByBusiness(businessId) {
      const rows = await db.shop.findMany({
        where: { business_id: businessId, active: true },
        orderBy: { name: "asc" },
      });
      return rows.map(toRecord);
    },
    async createSubscription(businessId) {
      return toRecord(
        await db.subscription.create({
          data: {
            id: randomUUID(),
            business_id: businessId,
            plan: "basic",
            status: "trialing",
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        })
      );
    },
    async getSubscription(businessId) {
      return toRecord(await db.subscription.findUnique({ where: { business_id: businessId } }));
    },
    async updateSubscription(businessId, plan) {
      await db.subscription.update({ where: { business_id: businessId }, data: { plan } });
    },
    async createSession(input) {
      await db.session.create({
        data: {
          id: randomUUID(),
          account_id: input.accountId,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt,
        },
      });
    },
    async findSessionByToken(tokenHash) {
      return toRecord(await db.session.findUnique({ where: { token_hash: tokenHash } }));
    },
    async revokeSession(sessionId) {
      await db.session.update({ where: { id: sessionId }, data: { revoked_at: new Date() } });
    },
    async revokeAllSessionsForAccount(accountId) {
      await db.session.updateMany({
        where: { account_id: accountId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    },
    async createPasswordResetToken(input) {
      await db.passwordResetToken.create({
        data: {
          id: randomUUID(),
          account_id: input.accountId,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt,
        },
      });
    },
    async findPasswordResetToken(tokenHash) {
      const row = await db.passwordResetToken.findUnique({ where: { token_hash: tokenHash } });
      return row ? { ...row, business_id: "" } : null;
    },
    async markPasswordResetTokenUsed(id) {
      await db.passwordResetToken.update({
        where: { id },
        data: { used_at: new Date() },
      });
    },
    async countUsage(businessId) {
      const [staff, branches, skus] = await Promise.all([
        db.account.count({ where: { business_id: businessId, active: true } }),
        db.shop.count({ where: { business_id: businessId, active: true } }),
        db.product.count({ where: { shop: { business_id: businessId }, active: true } }),
      ]);
      return { staff, branches, skus };
    },
    async createAudit(input) {
      await db.auditEvent.create({
        data: {
          id: randomUUID(),
          business_id: input.actor.businessId,
          account_id: input.actor.accountId ?? null,
          action: input.action,
          target_type: input.targetType ?? null,
          target_id: input.targetId ?? null,
          metadata: JSON.stringify(input.metadata ?? {}),
        },
      });
    },
    async createNotification(input) {
      await db.notification.create({
        data: {
          id: randomUUID(),
          business_id: input.businessId,
          channel: input.channel,
          recipient: input.recipient,
          subject: input.subject,
          body: input.body,
        },
      });
    },
  };
}

export function hashSessionToken(token: string) {
  return hashSecret(token);
}
