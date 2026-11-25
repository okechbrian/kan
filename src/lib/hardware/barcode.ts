export function normaliseScan(raw: string) {
  return raw.replace(/[\s-]/g, "").trim();
}

export function isLikelyBarcode(raw: string) {
  const value = normaliseScan(raw);
  return /^\d{8,14}$/.test(value);
}

export type ScanKind = "barcode" | "qr" | "unknown";

export function classifyScan(raw: string): ScanKind {
  const value = normaliseScan(raw);
  if (!value) return "unknown";
  if (isLikelyBarcode(value)) return "barcode";
  if (value.length >= 8) return "qr";
  return "unknown";
}

export function findByCode<T extends { sku_code?: string; barcode?: string }>(
  products: T[],
  scan: string
) {
  const value = normaliseScan(scan);
  return products.find(
    (product) =>
      normaliseScan(product.barcode ?? "") === value ||
      normaliseScan(product.sku_code ?? "") === value
  );
}
