import { verticalById, supports, type VerticalCapability } from "./profiles";

export function validateVerticalSelection(verticalId: string) {
  const profile = verticalById(verticalId);
  if (!profile) return { ok: false as const, error: "unknown_vertical" };
  if (profile.state === "planned") {
    return { ok: false as const, error: "vertical_planned", wave: profile.wave };
  }
  return { ok: true as const, profile };
}

export function shopCanUse(verticalId: string, capability: VerticalCapability) {
  const profile = verticalById(verticalId);
  if (!profile || profile.state !== "available") return false;
  return supports(verticalId, capability);
}

export const WAVE_LABELS: Record<number, string> = {
  1: "Wave 1 · core reuse",
  2: "Wave 2 · expiry & bookings",
  3: "Wave 3 · production & delivery",
};

const STARTERS: Record<string, string[]> = {
  groceries: ["Sugar 1kg", "Cooking oil 1L", "Bar soap", "Posho 1kg", "Rice 1kg", "Soda 500ml"],
  kiosks: ["Soda 500ml", "Water 500ml", "Cigarettes", "Airtime", "Bread"],
  food_shops: ["Rice 1kg", "Beans 1kg", "Cooking oil 1L", "Salt", "Onions"],
  bars: ["Beer 500ml", "Soda 500ml", "Water 500ml", "Cigarettes", "Snacks"],
  smes: ["Stock item A", "Stock item B", "Stock item C"],
};

export function starterProducts(verticalId: string) {
  const check = validateVerticalSelection(verticalId);
  if (!check.ok) return [];
  return STARTERS[verticalId] ?? [];
}
