import { isValidUgxAmount } from "../money";
import type { PublicListing } from "./catalogue";

export type CartLine = { productId: string; quantity: number };

export const DELIVERY_BANDS = [
  { name: "Within the trading centre", fee: 0 },
  { name: "Within Kampala", fee: 5000 },
  { name: "Outside Kampala", fee: 15000 },
] as const;

export function deliveryFee(bandName: string) {
  const band = DELIVERY_BANDS.find((item) => item.name === bandName);
  return band?.fee ?? DELIVERY_BANDS[0].fee;
}

export type CartTotals = {
  subtotal: number;
  delivery: number;
  total: number;
  lines: { productId: string; name: string; quantity: number; lineTotal: number }[];
  warnings: string[];
};

export function cartTotals(
  cart: CartLine[],
  listings: PublicListing[],
  bandName: string
): CartTotals {
  const warnings: string[] = [];
  const lines: CartTotals["lines"] = [];
  let subtotal = 0;
  for (const item of cart) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      warnings.push("Invalid quantity ignored");
      continue;
    }
    const listing = listings.find((entry) => entry.id === item.productId);
    if (!listing) {
      warnings.push("Product not available");
      continue;
    }
    if (!isValidUgxAmount(listing.price)) {
      warnings.push(`Invalid price for ${listing.name}`);
      continue;
    }
    if (!listing.inStock) warnings.push(`${listing.name} is out of stock`);
    const lineTotal = listing.price * item.quantity;
    if (!Number.isSafeInteger(lineTotal)) {
      warnings.push(`Amount too large for ${listing.name}`);
      continue;
    }
    subtotal += lineTotal;
    lines.push({
      productId: item.productId,
      name: listing.name,
      quantity: item.quantity,
      lineTotal,
    });
  }
  const fee = deliveryFee(bandName);
  return { subtotal, delivery: fee, total: subtotal + fee, lines, warnings };
}

export function addToCart(cart: CartLine[], productId: string, quantity = 1) {
  if (!Number.isInteger(quantity) || quantity <= 0) return cart;
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    return cart.map((item) =>
      item.productId === productId
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  }
  return [...cart, { productId, quantity }];
}
