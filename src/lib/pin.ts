const PEPPER = "duuka-v1:";

async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `simple-${hash}`;
}

export async function hashPin(pin: string): Promise<string> {
  return sha256Hex(PEPPER + pin);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const current = await hashPin(pin);
  if (current === hash) return true;
  // Phase 1 seeds used unsalted SHA-256
  const legacy = await sha256Hex(pin);
  return legacy === hash;
}

export async function shopIdForUser(user: {
  shop_id: string | null;
  business_id: string;
}): Promise<string | null> {
  if (user.shop_id) return user.shop_id;
  const { db } = await import("./db");
  const shops = await db.shops
    .where("business_id")
    .equals(user.business_id)
    .filter((s) => s.active)
    .toArray();
  return shops[0]?.id ?? null;
}
