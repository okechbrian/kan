import { randomUUID } from "node:crypto";
import { checkQuota, planById } from "./plans";
import { hashPassword, verifyPassword } from "./password";
import { hashSecret, newSessionToken } from "./tokens";
import {
  validateCreateBranch,
  validateForgotPassword,
  validateInvite,
  validateLogin,
  validatePlanChange,
  validateResetPassword,
  validateSignup,
} from "./validation";
import { canAccessBusiness, hasPermission, type Permission } from "./access";
import { sanitizeMetadata, type AuditAction } from "./audit";
import { createPlatformStore, type PlatformStore, type PlatformRecord } from "./store";

export class PlatformNotConfiguredError extends Error {
  constructor() {
    super("platform_not_configured");
  }
}

export class PlatformError extends Error {
  constructor(
    public code: string,
    public status: number
  ) {
    super(code);
  }
}

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_MS = 60 * 60 * 1000;

export type SessionContext = {
  accountId: string;
  businessId: string;
  role: string;
};

export class PlatformService {
  constructor(private store: PlatformStore) {}

  static create() {
    if (!process.env.DATABASE_URL) throw new PlatformNotConfiguredError();
    try {
      return new PlatformService(createPlatformStore());
    } catch {
      throw new PlatformNotConfiguredError();
    }
  }

  async signup(body: unknown) {
    const parsed = validateSignup(body);
    if (!parsed.ok) throw new PlatformError(parsed.error, 400);
    const existing = await this.store.findAccountByEmail(parsed.value.email);
    if (existing) throw new PlatformError("email_taken", 409);

    const business = await this.store.createBusiness({
      name: parsed.value.businessName,
      ownerEmail: parsed.value.email,
    });
    const account = await this.store.createAccount({
      businessId: business.id,
      email: parsed.value.email,
      passwordHash: hashPassword(parsed.value.password),
      role: "owner",
    });
    await this.store.createShop({ businessId: business.id, name: parsed.value.shopName });
    await this.store.createSubscription(business.id);
    await this.store.createAudit({
      actor: { businessId: business.id, accountId: account.id },
      action: "account.created",
      targetType: "business",
      targetId: business.id,
      metadata: { business: parsed.value.businessName },
    });
    return this.issueSession(account);
  }

  async login(body: unknown) {
    const parsed = validateLogin(body);
    if (!parsed.ok) throw new PlatformError("invalid_credentials", 400);
    const account = await this.store.findAccountByEmail(parsed.value.email);
    if (!account || !verifyPassword(parsed.value.password, String(account.password_hash))) {
      throw new PlatformError("invalid_credentials", 401);
    }
    if (account.active === false) throw new PlatformError("account_inactive", 403);
    await this.store.createAudit({
      actor: { businessId: String(account.business_id), accountId: account.id },
      action: "account.signed_in",
    });
    return this.issueSession(account);
  }

  private async issueSession(account: PlatformRecord) {
    const token = newSessionToken();
    await this.store.createSession({
      accountId: account.id,
      tokenHash: hashSecret(token),
      expiresAt: new Date(Date.now() + SESSION_MS),
    });
    return {
      token,
      account: {
        id: account.id,
        email: account.email,
        role: account.role,
        businessId: account.business_id,
      },
    };
  }

  async logout(token: string, ctx: SessionContext) {
    const session = await this.store.findSessionByToken(hashSecret(token));
    if (session) await this.store.revokeSession(session.id);
    await this.store.createAudit({
      actor: { businessId: ctx.businessId, accountId: ctx.accountId },
      action: "account.signed_out",
    });
  }

  async requestPasswordReset(body: unknown) {
    const parsed = validateForgotPassword(body);
    if (!parsed.ok) throw new PlatformError(parsed.error, 400);

    const account = await this.store.findAccountByEmail(parsed.value.email);
    if (!account || account.active === false) {
      return { ok: true };
    }

    const rawToken = newSessionToken();
    await this.store.createPasswordResetToken({
      accountId: account.id,
      tokenHash: hashSecret(rawToken),
      expiresAt: new Date(Date.now() + RESET_MS),
    });
    await this.store.createNotification({
      businessId: String(account.business_id),
      channel: "email",
      recipient: String(account.email),
      subject: "Reset your Kan password",
      body: `Reset your Kan password within one hour: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/app/reset-password?token=${encodeURIComponent(rawToken)}`,
    });
    await this.store.createAudit({
      actor: { businessId: String(account.business_id), accountId: account.id },
      action: "password.reset_requested",
      targetType: "account",
      targetId: account.id,
    });

    return { ok: true };
  }

  async resetPassword(body: unknown) {
    const parsed = validateResetPassword(body);
    if (!parsed.ok) throw new PlatformError(parsed.error, 400);

    const record = await this.store.findPasswordResetToken(hashSecret(parsed.value.token));
    if (!record || record.used_at || new Date(String(record.expires_at)) < new Date()) {
      throw new PlatformError("invalid_reset_token", 400);
    }

    const account = await this.store.findAccountById(String(record.account_id));
    if (!account || account.active === false) {
      throw new PlatformError("invalid_reset_token", 400);
    }

    await this.store.updateAccountPassword(account.id, hashPassword(parsed.value.password));
    await this.store.markPasswordResetTokenUsed(record.id);
    await this.store.revokeAllSessionsForAccount(account.id);
    await this.store.createAudit({
      actor: { businessId: String(account.business_id), accountId: account.id },
      action: "password.reset",
      targetType: "account",
      targetId: account.id,
    });
    return { ok: true };
  }

  async getWorkspace(ctx: SessionContext) {
    const [account, business, subscription, shops, usage] = await Promise.all([
      this.store.findAccountById(ctx.accountId),
      this.store.findBusinessById(ctx.businessId),
      this.store.getSubscription(ctx.businessId),
      this.store.listShopsByBusiness(ctx.businessId),
      this.store.countUsage(ctx.businessId),
    ]);

    return {
      account: account
        ? {
            id: account.id,
            email: account.email,
            role: account.role,
            businessId: account.business_id,
          }
        : null,
      business: business ? { id: business.id, name: business.name } : null,
      subscription: subscription
        ? {
            plan: String(subscription.plan ?? "basic"),
            status: String(subscription.status ?? "trialing"),
          }
        : { plan: "basic", status: "trialing" },
      shops: shops.map((s) => ({
        id: s.id,
        name: s.name,
        shop_code: s.shop_code,
        momo_number: s.momo_number,
        currency: s.currency ?? "UGX",
      })),
      usage,
    };
  }

  async createBranch(ctx: SessionContext, body: unknown) {
    if (!hasPermission(ctx.role, "manage_settings")) {
      throw new PlatformError("forbidden", 403);
    }
    const parsed = validateCreateBranch(body);
    if (!parsed.ok) throw new PlatformError(parsed.error, 400);

    const [usage, subscription] = await Promise.all([
      this.store.countUsage(ctx.businessId),
      this.store.getSubscription(ctx.businessId),
    ]);
    const plan = planById(String(subscription?.plan ?? "basic"));
    if (
      !plan ||
      !checkQuota(plan.id, { staff: 0, branches: usage.branches, skus: 0 }).allowed
    ) {
      throw new PlatformError("branches_limit_reached", 409);
    }

    const shop = await this.store.createShop({
      businessId: ctx.businessId,
      name: parsed.value.name,
      momoNumber: parsed.value.momoNumber,
    });
    await this.store.createAudit({
      actor: { businessId: ctx.businessId, accountId: ctx.accountId },
      action: "shop.created",
      targetType: "shop",
      targetId: shop.id,
      metadata: { name: parsed.value.name },
    });
    return {
      id: shop.id,
      name: shop.name,
      shop_code: shop.shop_code,
      momo_number: shop.momo_number,
      currency: shop.currency ?? "UGX",
    };
  }

  async requireSession(token: string | undefined): Promise<SessionContext> {
    if (!token) throw new PlatformError("unauthorized", 401);
    const session = await this.store.findSessionByToken(hashSecret(token));
    if (!session || session.revoked_at || new Date(String(session.expires_at)) < new Date()) {
      throw new PlatformError("unauthorized", 401);
    }
    const account = await this.store.findAccountById(String(session.account_id));
    if (!account || account.active === false) throw new PlatformError("unauthorized", 401);
    return {
      accountId: account.id,
      businessId: String(account.business_id),
      role: String(account.role),
    };
  }

  async requirePermission(token: string | undefined, permission: Permission) {
    const ctx = await this.requireSession(token);
    if (!hasPermission(ctx.role, permission)) throw new PlatformError("forbidden", 403);
    return ctx;
  }

  async requireBusiness(token: string | undefined, businessId: string) {
    const ctx = await this.requireSession(token);
    if (!canAccessBusiness(ctx.role, ctx.businessId, businessId)) {
      throw new PlatformError("forbidden", 403);
    }
    return ctx;
  }

  async inviteStaff(ctx: SessionContext, businessId: string, body: unknown) {
    if (!hasPermission(ctx.role, "manage_users")) throw new PlatformError("forbidden", 403);
    if (ctx.businessId !== businessId) throw new PlatformError("forbidden", 403);
    const parsed = validateInvite(body, ["sell", "manage_stock", "manage_customers", "view_reports"]);
    if (!parsed.ok) throw new PlatformError(parsed.error, 400);
    const usage = await this.store.countUsage(businessId);
    const subscription = await this.store.getSubscription(businessId);
    const plan = planById(String(subscription?.plan ?? "basic"));
    if (!plan || !checkQuota(plan.id, { ...usage, staff: usage.staff + 1 }).allowed) {
      throw new PlatformError("staff_limit_reached", 409);
    }
    const existing = await this.store.findAccountByEmail(parsed.value.email);
    if (existing) throw new PlatformError("email_taken", 409);
    const password = randomUUID().replace(/-/g, "").slice(0, 16);
    await this.store.createAccount({
      businessId,
      email: parsed.value.email,
      passwordHash: hashPassword(password),
      role: parsed.value.role,
    });
    await this.store.createNotification({
      businessId,
      channel: "email",
      recipient: parsed.value.email,
      subject: "Your Kan account",
      body: `Your temporary password is ${password}. Change it after your first sign-in.`,
    });
    await this.store.createAudit({
      actor: { businessId, accountId: ctx.accountId },
      action: "account.created",
      targetType: "account",
      metadata: sanitizeMetadata({ role: parsed.value.role }),
    });
    return { email: parsed.value.email, temporaryPassword: password };
  }

  async changePlan(ctx: SessionContext, businessId: string, body: unknown) {
    if (!hasPermission(ctx.role, "manage_billing")) throw new PlatformError("forbidden", 403);
    if (ctx.businessId !== businessId) throw new PlatformError("forbidden", 403);
    const parsed = validatePlanChange(body);
    if (!parsed.ok) throw new PlatformError(parsed.error, 400);
    const usage = await this.store.countUsage(businessId);
    if (!checkQuota(parsed.value.plan, usage).allowed) {
      throw new PlatformError("current_usage_exceeds_plan", 409);
    }
    await this.store.updateSubscription(businessId, parsed.value.plan);
    await this.store.createAudit({
      actor: { businessId, accountId: ctx.accountId },
      action: "subscription.changed" as AuditAction,
      targetType: "subscription",
      targetId: businessId,
      metadata: sanitizeMetadata({ plan: parsed.value.plan }),
    });
  }

  async recordAudit(
    ctx: SessionContext,
    action: AuditAction,
    input: { targetType?: string; targetId?: string; metadata?: Record<string, unknown> } = {}
  ) {
    await this.store.createAudit({
      actor: { businessId: ctx.businessId, accountId: ctx.accountId },
      action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: sanitizeMetadata(input.metadata ?? {}),
    });
  }
}
