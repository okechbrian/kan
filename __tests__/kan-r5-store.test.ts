import { describe, it, expect } from "vitest";
import { slugifyShop, publicCatalogue, type CatalogueProduct } from "../src/lib/store/catalogue";
import { addToCart, cartTotals, deliveryFee, DELIVERY_BANDS } from "../src/lib/store/cart";
import { buildOrder, canTransition, nextStatus, invoiceText, type OrderStatus } from "../src/lib/store/orders";

const products: CatalogueProduct[] = [
  {
    id: "p1",
    name: "Sugar 1kg",
    selling_price: 5000,
    stock_qty: 5,
    active: true,
    expiry_date: null,
    expiry_tracked: false,
  },
  {
    id: "p2",
    name: "Old milk",
    selling_price: 3000,
    stock_qty: 2,
    active: true,
    expiry_date: "2020-01-01",
    expiry_tracked: true,
  },
  {
    id: "p3",
    name: "Hidden item",
    selling_price: 1000,
    stock_qty: 3,
    active: false,
  },
];

describe("Kan R5 — catalogue sync", () => {
  it("makes a safe slug", () => {
    expect(slugifyShop("Nateete Branch!")).toBe("nateete-branch");
    expect(slugifyShop("!!!")).toBe("shop");
  });

  it("publishes only active, unexpired products", () => {
    const listings = publicCatalogue(products);
    expect(listings.map((item) => item.id)).toEqual(["p1"]);
    expect(publicCatalogue(products, { hideOutOfStock: true })).toHaveLength(1);
    expect(publicCatalogue([{ ...products[0], stock_qty: 0 }], { hideOutOfStock: true })).toHaveLength(0);
  });
});

describe("Kan R5 — cart", () => {
  it("adds quantities and computes integer totals", () => {
    const listings = publicCatalogue(products);
    let cart = addToCart([], "p1", 2);
    cart = addToCart(cart, "p1", 1);
    const totals = cartTotals(cart, listings, DELIVERY_BANDS[1].name);
    expect(totals.subtotal).toBe(15000);
    expect(totals.delivery).toBe(5000);
    expect(totals.total).toBe(20000);
    expect(totals.lines[0].lineTotal).toBe(15000);
  });

  it("uses fixed delivery bands and flags out-of-stock products", () => {
    expect(deliveryFee("Within Kampala")).toBe(5000);
    expect(deliveryFee("Nowhere")).toBe(0);
    const totals = cartTotals([{ productId: "p1", quantity: 1 }], publicCatalogue([{ ...products[0], stock_qty: 0 }]), "Within the trading centre");
    expect(totals.warnings).toContain("Sugar 1kg is out of stock");
  });
});

describe("Kan R5 — orders", () => {
  it("follows a one-way order state machine", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "pending")).toBe(false);
    expect(nextStatus("in_transit")).toBe("delivered");
    expect(nextStatus("delivered")).toBeNull();
    const statuses: OrderStatus[] = ["pending", "confirmed", "preparing", "in_transit", "delivered"];
    for (const status of statuses.slice(0, -1)) {
      expect(nextStatus(status)).toBe(statuses[statuses.indexOf(status) + 1]);
    }
  });

  it("builds an order with a validated phone and integer money", () => {
    const listings = publicCatalogue(products);
    const totals = cartTotals([{ productId: "p1", quantity: 2 }], listings, "Within Kampala");
    const order = buildOrder({
      shopId: "s1",
      slug: "demo-duuka",
      customerPhone: "0775931342",
      bandName: "Within Kampala",
      totals,
    });
    expect(order.total).toBe(15000);
    expect(order.status).toBe("pending");
    expect(() =>
      buildOrder({ shopId: "s1", slug: "demo-duuka", customerPhone: "abc", bandName: "Within Kampala", totals })
    ).toThrow("invalid_phone");
  });

  it("renders an invoice with delivery and totals", () => {
    const text = invoiceText({
      slug: "demo-duuka",
      customer_phone: "0775931342",
      delivery_band: "Within Kampala",
      items: [{ name: "Sugar 1kg", quantity: 2, lineTotal: 10000 }],
      subtotal: 10000,
      delivery_fee: 5000,
      total: 15000,
    });
    expect(text).toContain("UGX 15,000");
    expect(text).toContain("Delivery UGX 5,000");
  });
});
