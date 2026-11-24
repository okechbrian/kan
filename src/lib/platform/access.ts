export const ROLES = ["owner", "manager", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "sell",
  "manage_stock",
  "manage_products",
  "manage_customers",
  "view_reports",
  "manage_users",
  "manage_billing",
  "manage_settings",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const GRANTS: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  manager: [
    "sell",
    "manage_stock",
    "manage_products",
    "manage_customers",
    "view_reports",
  ],
  staff: ["sell", "manage_customers"],
};

export function hasPermission(role: string, permission: Permission) {
  if (!ROLES.includes(role as Role)) return false;
  return GRANTS[role as Role].includes(permission);
}

export function canAccessBusiness(role: string, accountBusinessId: string, targetBusinessId: string) {
  return accountBusinessId === targetBusinessId && hasPermission(role, "view_reports");
}

export function canAccessShop(
  role: string,
  accountBusinessId: string,
  targetBusinessId: string,
  accountShopId: string | null,
  targetShopId: string
) {
  if (accountBusinessId !== targetBusinessId) return false;
  if (role === "owner") return true;
  return accountShopId === targetShopId;
}
