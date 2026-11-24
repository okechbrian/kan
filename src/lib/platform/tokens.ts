import { createHash, randomBytes } from "node:crypto";

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function newSubscriptionToken() {
  return randomBytes(24).toString("base64url");
}
