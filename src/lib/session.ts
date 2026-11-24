import { db, type User } from "./db";

const USER_KEY = "duuka_user_id";
const SHOP_KEY = "duuka_shop_id";
const ROLE_KEY = "duuka_role";

export function getSession(): { userId: string; shopId: string } | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem(USER_KEY);
  const shopId = localStorage.getItem(SHOP_KEY);
  if (!userId || !shopId) return null;
  return { userId, shopId };
}

export async function getCurrentUser(): Promise<{
  userId: string;
  shopId: string;
  role: User["role"];
  name: string;
} | null> {
  const session = getSession();
  if (!session) return null;
  const user = await db.users.get(session.userId);
  if (!user || !user.active) return null;
  return {
    userId: session.userId,
    shopId: session.shopId,
    role: user.role,
    name: user.name,
  };
}

export async function requireOwner(userId: string): Promise<void> {
  const user = await db.users.get(userId);
  if (!user || user.role !== "owner") {
    throw new Error("Owner only");
  }
}

export async function setSession(
  userId: string,
  shopId: string
): Promise<void> {
  localStorage.setItem(USER_KEY, userId);
  localStorage.setItem(SHOP_KEY, shopId);
  const user = await db.users.get(userId);
  if (user) {
    localStorage.setItem(ROLE_KEY, user.role);
  }
}

export function clearSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SHOP_KEY);
  localStorage.removeItem(ROLE_KEY);
}
