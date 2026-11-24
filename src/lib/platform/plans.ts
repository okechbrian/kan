export const PLANS = [
  {
    id: "basic",
    name: "Basic",
    staff: 2,
    branches: 1,
    skus: 500,
    offersStore: false,
    hasAdvancedImport: false,
    hasAi: false,
  },
  {
    id: "growth",
    name: "Growth",
    staff: 3,
    branches: 2,
    skus: 1000,
    offersStore: true,
    hasAdvancedImport: false,
    hasAi: false,
  },
  {
    id: "scale-up",
    name: "Scale-Up",
    staff: 5,
    branches: 5,
    skus: 2000,
    offersStore: true,
    hasAdvancedImport: true,
    hasAi: false,
  },
  {
    id: "premium",
    name: "Premium",
    staff: 20,
    branches: 8,
    skus: 6000,
    offersStore: true,
    hasAdvancedImport: true,
    hasAi: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    staff: Number.POSITIVE_INFINITY,
    branches: Number.POSITIVE_INFINITY,
    skus: Number.POSITIVE_INFINITY,
    offersStore: true,
    hasAdvancedImport: true,
    hasAi: true,
  },
] as const;

export type PlanId = (typeof PLANS)[number]["id"];

export function planById(id: string) {
  return PLANS.find((plan) => plan.id === id);
}

export type Usage = {
  staff: number;
  branches: number;
  skus: number;
};

export type QuotaResult = {
  allowed: boolean;
  reason?: string;
};

export function checkQuota(planId: string, usage: Usage): QuotaResult {
  const plan = planById(planId);
  if (!plan) return { allowed: false, reason: "unknown_plan" };
  for (const key of ["staff", "branches", "skus"] as const) {
    if (usage[key] >= plan[key]) {
      return { allowed: false, reason: `${key}_limit_reached` };
    }
  }
  return { allowed: true };
}

export function planAllows(planId: string, feature: "store" | "bulkImport" | "ai") {
  const plan = planById(planId);
  if (!plan) return false;
  if (feature === "store") return plan.offersStore;
  if (feature === "bulkImport") return plan.hasAdvancedImport;
  return plan.hasAi;
}
