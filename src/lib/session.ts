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
  const shop = await db.shops.get(session.shopId);
  if (!user || !user.active || !shop?.active || user.business_id !== shop.business_id ||
      (user.role !== "owner" && user.shop_id !== shop.id)) return null;
  return {
    userId: session.userId,
    shopId: session.shopId,
    role: user.role,
    name: user.name,
  };
}

export async function requireOwner(userId: string, shopId?: string): Promise<void> {
  const user = await db.users.get(userId);
  if (!user?.active || user.role !== "owner") {
    throw new Error("Owner only");
  }
  if (shopId) await requireShopUser(userId, shopId);
}

export async function requireShopUser(userId: string, shopId: string) {
  const [user, shop] = await Promise.all([db.users.get(userId), db.shops.get(shopId)]);
  if (!user?.active || !shop?.active || user.business_id !== shop.business_id ||
      (user.role !== "owner" && user.shop_id !== shopId)) throw new Error("Shop access denied");
  return user;
}

export async function requireOpenShift(shopId: string, shiftId: string, userId: string) {
  const user = await requireShopUser(userId, shopId);
  const shift = await db.shifts.get(shiftId);
  if (!shift || shift.shop_id !== shopId || shift.status !== "open" ||
      (user.role !== "owner" && shift.user_id !== userId)) throw new Error("Till is not open");
  return shift;
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
  window.dispatchEvent(new Event("kan-session"));
}

export function clearSession(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SHOP_KEY);
  localStorage.removeItem(ROLE_KEY);
  window.dispatchEvent(new Event("kan-session"));
}
