import { isValidUgxAmount } from "../money";

export const UNITS = ["pc", "kg", "g", "l", "ml", "packet", "dozen", "sachet"] as const;
export type Unit = (typeof UNITS)[number];

export type CatalogueProductInput = {
  name: string;
  unit: string;
  sellingPrice: number;
  buyingPrice: number;
  barcode?: string;
  reorderLevel?: number;
  brand?: string;
  expiryTracked?: boolean;
};

export type CatalogueValidation =
  | { ok: true; value: Required<Pick<CatalogueProductInput, "name" | "unit" | "sellingPrice" | "buyingPrice" | "barcode" | "reorderLevel" | "brand" | "expiryTracked">> }
  | { ok: false; error: string };

export function normaliseBarcode(input: string | undefined) {
  const barcode = (input ?? "").replace(/[\s-]/g, "");
  if (!barcode) return "";
  if (!/^\d{8,14}$/.test(barcode)) throw new Error("invalid_barcode");
  return barcode;
}

export function validateProduct(input: CatalogueProductInput): CatalogueValidation {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 120) return { ok: false, error: "invalid_name" };
  if (!(UNITS as readonly string[]).includes(input.unit)) return { ok: false, error: "invalid_unit" };
  if (!isValidUgxAmount(input.sellingPrice)) return { ok: false, error: "invalid_selling_price" };
  if (!isValidUgxAmount(input.buyingPrice)) return { ok: false, error: "invalid_buying_price" };
  if (input.reorderLevel !== undefined && !Number.isInteger(input.reorderLevel)) {
    return { ok: false, error: "invalid_reorder_level" };
  }
  if (input.reorderLevel !== undefined && (input.reorderLevel as number) < 0) {
    return { ok: false, error: "invalid_reorder_level" };
  }
  let barcode: string;
  try {
    barcode = normaliseBarcode(input.barcode);
  } catch {
    return { ok: false, error: "invalid_barcode" };
  }
  return {
    ok: true,
    value: {
      name,
      unit: input.unit,
      sellingPrice: input.sellingPrice,
      buyingPrice: input.buyingPrice,
      barcode,
      reorderLevel: input.reorderLevel ?? 5,
      brand: (input.brand ?? "").trim().slice(0, 80),
      expiryTracked: input.expiryTracked ?? false,
    },
  };
}

export function isLowStock(quantity: number, reorderLevel: number) {
  return quantity <= reorderLevel;
}
