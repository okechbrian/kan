export type VerticalCapability =
  | "fast_movers"
  | "credit"
  | "multi_branch"
  | "expiry"
  | "bookings"
  | "tables"
  | "recipes"
  | "serials"
  | "delivery"
  | "batches";

export type VerticalProfile = {
  id: string;
  name: string;
  wave: 1 | 2 | 3;
  state: "available" | "planned";
  summary: string;
  capabilities: VerticalCapability[];
  reorderLevel: number;
};

export const VERTICALS: VerticalProfile[] = [
  { id: "groceries", name: "Groceries", wave: 1, state: "available", summary: "Fast movers, deni and a daily till close.", capabilities: ["fast_movers", "credit"], reorderLevel: 5 },
  { id: "kiosks", name: "Kiosks", wave: 1, state: "available", summary: "One counter, simple catalogue, offline sales.", capabilities: ["fast_movers"], reorderLevel: 3 },
  { id: "food_shops", name: "Food shops", wave: 1, state: "available", summary: "Stock, sales and credit in one book.", capabilities: ["credit", "fast_movers"], reorderLevel: 5 },
  { id: "bars", name: "Bars", wave: 1, state: "available", summary: "Track stock and takings; tabs come with service commerce.", capabilities: ["fast_movers"], reorderLevel: 5 },
  { id: "smes", name: "SMEs", wave: 1, state: "available", summary: "One owner, many branches, one set of books.", capabilities: ["multi_branch", "credit"], reorderLevel: 5 },
  { id: "pharmacy", name: "Pharmacy", wave: 2, state: "planned", summary: "Batch and expiry tracking before it can be trusted.", capabilities: ["expiry", "batches"], reorderLevel: 5 },
  { id: "bakeries", name: "Bakeries", wave: 2, state: "planned", summary: "Production batches and daily fresh stock.", capabilities: ["batches", "recipes"], reorderLevel: 5 },
  { id: "restaurants", name: "Restaurants", wave: 2, state: "planned", summary: "Menus, tables and online orders.", capabilities: ["tables", "delivery"], reorderLevel: 5 },
  { id: "spas_salons", name: "Spas and salons", wave: 2, state: "planned", summary: "Bookings, staff schedules and services.", capabilities: ["bookings"], reorderLevel: 3 },
  { id: "laundries", name: "Laundries", wave: 2, state: "planned", summary: "Order tracking from drop-off to collection.", capabilities: ["bookings", "delivery"], reorderLevel: 3 },
  { id: "superstores", name: "Superstores", wave: 3, state: "planned", summary: "Barcode scanning and high-volume checkout.", capabilities: ["fast_movers", "serials"], reorderLevel: 5 },
  { id: "fashion", name: "Fashion shops", wave: 3, state: "planned", summary: "Measurements and made-to-order jobs.", capabilities: ["bookings"], reorderLevel: 3 },
  { id: "agro", name: "Agro-based products", wave: 3, state: "planned", summary: "Produce units and seasonal buying.", capabilities: ["batches"], reorderLevel: 5 },
  { id: "electrical", name: "Electrical & electronics", wave: 3, state: "planned", summary: "Serial numbers and warranty records.", capabilities: ["serials"], reorderLevel: 3 },
  { id: "furniture", name: "Furniture shops", wave: 3, state: "planned", summary: "Large items, delivery and deposits.", capabilities: ["delivery", "serials"], reorderLevel: 3 },
  { id: "factories", name: "Factories", wave: 3, state: "planned", summary: "Recipes, BOM and production runs.", capabilities: ["recipes", "batches"], reorderLevel: 5 },
];

export function verticalById(id: string) {
  return VERTICALS.find((profile) => profile.id === id);
}

export function verticalsByWave(wave: 1 | 2 | 3) {
  return VERTICALS.filter((profile) => profile.wave === wave);
}

export function supports(verticalId: string, capability: VerticalCapability) {
  return verticalById(verticalId)?.capabilities.includes(capability) ?? false;
}

export function recommendedReorderLevel(verticalId: string) {
  return verticalById(verticalId)?.reorderLevel ?? 5;
}
