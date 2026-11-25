export const PARTNER_FEATURES = [
  { id: "wallet", name: "Business wallet", state: "with_partner" as const, available: false },
  { id: "transfers", name: "Transfers and payouts", state: "with_partner" as const, available: false },
  { id: "settlements", name: "Payment settlements", state: "with_partner" as const, available: false },
  { id: "crypto", name: "Stablecoin receipts", state: "with_partner" as const, available: false },
];

export function canOffer(featureId: string) {
  return PARTNER_FEATURES.find((feature) => feature.id === featureId)?.available ?? false;
}

export function partnerMessage(featureId: string) {
  const feature = PARTNER_FEATURES.find((item) => item.id === featureId);
  if (!feature) return "Unknown feature.";
  return `${feature.name} needs a licensed partner. Kan never shows a balance it does not hold.`;
}
