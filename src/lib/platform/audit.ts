export const AUDIT_ACTIONS = [
  "account.created",
  "account.signed_in",
  "account.signed_out",
  "shop.created",
  "subscription.changed",
  "settings.changed",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export function sanitizeMetadata(metadata: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  const forbidden = ["password", "password_hash", "token", "token_hash", "pin", "pin_hash"];
  for (const [key, value] of Object.entries(metadata)) {
    if (forbidden.some((term) => key.toLowerCase().includes(term))) continue;
    safe[key] = value;
  }
  return safe;
}

export function describeAudit(action: string) {
  return action.replace(".", " ");
}
