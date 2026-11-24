import type { PublicListing } from "../store/catalogue";

export type SocialPost = {
  id: string;
  caption: string;
  link: string;
  productIds: string[];
  createdAt: string;
};

export function buildShareLink(
  slug: string,
  baseUrl: string,
  source: "whatsapp" | "facebook" | "instagram" | "x" | "link"
) {
  const storeUrl = `${baseUrl.replace(/\/$/, "")}/shop/${slug}`;
  switch (source) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`Shop ${slug} on Kan: ${storeUrl}`)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`;
    case "instagram":
    case "x":
      return storeUrl;
    default:
      return storeUrl;
  }
}

export function buildSocialPost(input: {
  slug: string;
  baseUrl: string;
  listings: PublicListing[];
  ids: string[];
  note?: string;
}): SocialPost | null {
  const picked = input.listings.filter((listing) => input.ids.includes(listing.id));
  if (picked.length === 0) return null;
  const names = picked.map((item) => item.name).join(", ");
  const note = (input.note ?? "").trim().slice(0, 120);
  const caption = [`Fresh from the shop: ${names}.`, note].filter(Boolean).join(" ");
  const link = buildShareLink(input.slug, input.baseUrl, "whatsapp");
  return {
    id: `post-${Date.now()}`,
    caption,
    link,
    productIds: picked.map((item) => item.id),
    createdAt: new Date().toISOString(),
  };
}
