import { expiryStatus } from "../commerce/inventory";

export type CatalogueProduct = {
  id: string;
  name: string;
  selling_price: number;
  stock_qty: number;
  active: boolean;
  photo_url?: string;
  expiry_date?: string | null;
  expiry_tracked?: boolean;
};

export type PublicListing = {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  photoUrl: string;
};

export function slugifyShop(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "shop"
  );
}

export function publicCatalogue(
  products: CatalogueProduct[],
  options: { hideOutOfStock?: boolean } = {}
): PublicListing[] {
  return products
    .filter((product) => product.active)
    .filter((product) => {
      if (!product.expiry_tracked || !product.expiry_date) return true;
      return expiryStatus(product.expiry_date) !== "expired";
    })
    .filter((product) => (options.hideOutOfStock ? product.stock_qty > 0 : true))
    .map((product) => ({
      id: product.id,
      name: product.name,
      price: product.selling_price,
      inStock: product.stock_qty > 0,
      photoUrl: product.photo_url ?? "",
    }));
}

export function findProduct(listings: PublicListing[], id: string) {
  return listings.find((listing) => listing.id === id);
}
