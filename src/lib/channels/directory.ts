export type MerchantCategory =
  | "groceries"
  | "pharmacy"
  | "restaurants"
  | "fashion"
  | "agro"
  | "salons"
  | "other";

export type DirectoryMerchant = {
  id: string;
  name: string;
  slug: string;
  category: MerchantCategory;
  town: string;
  active: boolean;
};

export function searchMerchants(
  merchants: DirectoryMerchant[],
  query: { q?: string; category?: MerchantCategory; town?: string }
) {
  const q = (query.q ?? "").trim().toLowerCase();
  return merchants.filter((merchant) => {
    if (!merchant.active) return false;
    if (query.category && merchant.category !== query.category) return false;
    if (query.town && merchant.town.toLowerCase() !== query.town.toLowerCase()) return false;
    if (!q) return true;
    return (
      merchant.name.toLowerCase().includes(q) ||
      merchant.town.toLowerCase().includes(q) ||
      merchant.category.includes(q)
    );
  });
}

export function merchantHref(merchant: DirectoryMerchant) {
  return `/shop/${merchant.slug}`;
}
