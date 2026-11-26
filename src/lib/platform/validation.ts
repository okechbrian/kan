import type { Permission } from "./access";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateSignup(body: unknown): ValidationResult<{
  businessName: string;
  shopName: string;
  email: string;
  password: string;
}> {
  if (!isObject(body)) return { ok: false, error: "invalid_body" };
  if (["businessName", "shopName", "email", "password"].some((key) => typeof body[key] !== "string")) {
    return { ok: false, error: "invalid_body" };
  }
  const businessName = String(body.businessName ?? "").trim();
  const shopName = String(body.shopName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (businessName.length < 2 || businessName.length > 80) return { ok: false, error: "invalid_business_name" };
  if (shopName.length < 2 || shopName.length > 80) return { ok: false, error: "invalid_shop_name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { ok: false, error: "invalid_email" };
  if (password.length < 10 || password.length > 200) return { ok: false, error: "invalid_password" };
  return { ok: true, value: { businessName, shopName, email, password } };
}

export function validateLogin(body: unknown): ValidationResult<{ email: string; password: string }> {
  if (!isObject(body)) return { ok: false, error: "invalid_body" };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return { ok: false, error: "invalid_credentials" };
  return { ok: true, value: { email, password } };
}

export function validateInvite(body: unknown, permissions: readonly Permission[]): ValidationResult<{
  email: string;
  role: string;
  permissions: Permission[];
}> {
  if (!isObject(body)) return { ok: false, error: "invalid_body" };
  const email = String(body.email ?? "").trim().toLowerCase();
  const role = String(body.role ?? "staff");
  const requested = Array.isArray(body.permissions)
    ? body.permissions.map((item) => String(item))
    : [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "invalid_email" };
  if (!["manager", "staff"].includes(role)) return { ok: false, error: "invalid_role" };
  const allowed = requested.filter((item): item is Permission =>
    permissions.includes(item as Permission)
  );
  return { ok: true, value: { email, role, permissions: allowed } };
}

export function validatePlanChange(body: unknown): ValidationResult<{ plan: string }> {
  if (!isObject(body)) return { ok: false, error: "invalid_body" };
  const plan = String(body.plan ?? "");
  if (!["basic", "growth", "scale-up", "premium", "enterprise"].includes(plan)) {
    return { ok: false, error: "invalid_plan" };
  }
  return { ok: true, value: { plan } };
}

export function validateForgotPassword(body: unknown): ValidationResult<{ email: string }> {
  if (!isObject(body)) return { ok: false, error: "invalid_body" };
  if (typeof body.email !== "string") return { ok: false, error: "invalid_email" };
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "invalid_email" };
  }
  return { ok: true, value: { email } };
}

export function validateResetPassword(body: unknown): ValidationResult<{
  token: string;
  password: string;
}> {
  if (!isObject(body)) return { ok: false, error: "invalid_body" };
  if (typeof body.token !== "string" || typeof body.password !== "string") return { ok: false, error: "invalid_body" };
  const token = String(body.token ?? "").trim();
  const password = String(body.password ?? "");
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return { ok: false, error: "invalid_reset_token" };
  if (password.length < 10 || password.length > 200) {
    return { ok: false, error: "invalid_password" };
  }
  return { ok: true, value: { token, password } };
}

export function validateCreateBranch(body: unknown): ValidationResult<{
  name: string;
  momoNumber: string;
}> {
  if (!isObject(body)) return { ok: false, error: "invalid_body" };
  const name = String(body.name ?? "").trim();
  const momoNumber = String(body.momoNumber ?? "").trim();
  if (name.length < 2 || name.length > 80) {
    return { ok: false, error: "invalid_branch_name" };
  }
  return { ok: true, value: { name, momoNumber } };
}
