import { describe, it, expect } from "vitest";
import { buildShareLink, buildSocialPost } from "../src/lib/channels/social";
import { syncPlan, unifiedOrders } from "../src/lib/channels/marketplace";
import { searchMerchants, merchantHref, type DirectoryMerchant } from "../src/lib/channels/directory";
import type { PublicListing } from "../src/lib/store/catalogue";

const listings: PublicListing[] = [
  { id: "p1", name: "Sugar 1kg", price: 5000, inStock: true, photoUrl: "" },
  { id: "p2", name: "Soap", price: 3500, inStock: true, photoUrl: "" },
];

const merchants: DirectoryMerchant[] = [
  { id: "1", name: "Nateete Shop", slug: "nateete-shop", category: "groceries", town: "Kampala", active: true },
  { id: "2", name: "Kira Pharmacy", slug: "kira-pharmacy", category: "pharmacy", town: "Wakiso", active: true },
  { id: "3", name: "Closed Shop", slug: "closed-shop", category: "groceries", town: "Kampala", active: false },
];

describe("Kan R6 — social store", () => {
  it("builds share links without leaking a fake backend", () => {
    const base = "https://kan-sme.vercel.app/";
    expect(buildShareLink("demo-duuka", base, "link")).toBe(
      "https://kan-sme.vercel.app/shop/demo-duuka"
    );
    expect(buildShareLink("demo-duuka", base, "whatsapp")).toContain("wa.me");
    expect(buildShareLink("demo-duuka", base, "facebook")).toContain("facebook.com");
  });

  it("makes a post from selected products", () => {
    const post = buildSocialPost({
      slug: "demo-duuka",
      baseUrl: "https://kan-sme.vercel.app",
      listings,
      ids: ["p1", "p2"],
      note: "Fresh stock today",
    });
    expect(post?.caption).toContain("Sugar 1kg, Soap");
    expect(post?.caption).toContain("Fresh stock today");
    expect(post?.productIds).toEqual(["p1", "p2"]);
    expect(
      buildSocialPost({ slug: "demo-duuka", baseUrl: "x", listings, ids: [] })
    ).toBeNull();
  });
});

describe("Kan R6 — marketplace connector", () => {
  it("marks unavailable channels and out-of-stock products", () => {
    const items = syncPlan({
      productIds: ["p1", "p2"],
      channels: ["online_store", "social_store", "whatsapp"],
      inStock: (id) => id === "p1",
      allowedChannels: ["online_store", "whatsapp"],
    });
    expect(items).toHaveLength(6);
    expect(items.find((i) => i.channel === "social_store")?.status).toBe("unavailable");
    expect(items.find((i) => i.channel === "online_store" && i.productId === "p2")?.status).toBe(
      "out_of_stock"
    );
    expect(items.find((i) => i.channel === "whatsapp" && i.productId === "p1")?.status).toBe("pending");
  });

  it("unifies orders by source without changing them", () => {
    const orders = [
      { id: "1", source: "social_store" },
      { id: "2", source: "online_store" },
    ];
    expect(unifiedOrders(orders).map((order) => order.id)).toEqual(["2", "1"]);
  });
});

describe("Kan R6 — merchant directory", () => {
  it("filters by query, category and town", () => {
    expect(searchMerchants(merchants, { q: "kira" }).map((m) => m.id)).toEqual(["2"]);
    expect(searchMerchants(merchants, { category: "groceries" }).map((m) => m.id)).toEqual(["1"]);
    expect(searchMerchants(merchants, { town: "Kampala" }).map((m) => m.id)).toEqual(["1"]);
    expect(searchMerchants(merchants, {})).toHaveLength(2);
  });

  it("links to the path-based storefront", () => {
    expect(merchantHref(merchants[0])).toBe("/shop/nateete-shop");
  });
});
