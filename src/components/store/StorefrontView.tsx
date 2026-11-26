"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "../../lib/db";
import { ugx } from "../../lib/money";
import { publicCatalogue, slugifyShop, type PublicListing } from "../../lib/store/catalogue";
import { addToCart, cartTotals, DELIVERY_BANDS, type CartLine } from "../../lib/store/cart";
import { buildOrder } from "../../lib/store/orders";
import { StatusBadge } from "../site/StatusBadge";

export function StorefrontView({ slug }: { slug: string }) {
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [shopName, setShopName] = useState("Shop");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [band, setBand] = useState<string>(DELIVERY_BANDS[0].name);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [shops, products] = await Promise.all([
        db.shops.toArray(),
        db.products.toArray(),
      ]);
      const session = (await import("../../lib/session")).getCurrentUser;
      const user = await session();
      const match = user?.role === "owner" ? shops.find((shop) => shop.id === user.shopId && slugifyShop(shop.name) === slug) : undefined;
      if (match) {
        setShopName(match.name);
        setListings(publicCatalogue(products.filter((p) => p.shop_id === match.id && (p.published_online ?? false))));
      }
      setLoading(false);
    }
    void load();
  }, [slug]);

  const totals = useMemo(() => cartTotals(cart, listings, band), [cart, listings, band]);

  function checkout() {
    try {
      const order = buildOrder({
        shopId: "preview",
        slug,
        customerPhone: phone,
        bandName: band,
        totals,
      });
      setMessage(
        `Preview order built for ${order.items.length} item(s), total ${ugx(
          order.total
        )}. No order was sent — online ordering opens with cloud sync.`
      );
    } catch {
      setMessage("Enter a valid Uganda phone number and add at least one item.");
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-ink/50">Loading storefront...</p>;
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-kan">
              Kan storefront
            </p>
            <h1 className="text-xl font-black text-ink">{shopName}</h1>
          </div>
          <StatusBadge state="soon" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="mb-6 rounded-xl border border-sun/30 bg-sun/10 p-3 text-xs text-ink/60">
          This is an owner-only local storefront preview. Shared links do not show your catalogue to buyers and online orders are not available. Browsing and cart maths work offline.
        </p>

        {listings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-ink/50">
            Unlock this shop with an owner PIN to preview its published products. Online shopping is coming soon.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <article key={listing.id} className="card flex flex-col gap-3">
                <div className="flex h-24 items-center justify-center rounded-xl bg-kan-soft text-3xl text-kan">
                  {listing.photoUrl ? "📦" : "◍"}
                </div>
                <h2 className="text-sm font-bold text-ink">{listing.name}</h2>
                <p className="text-lg font-black text-kan">{ugx(listing.price)}</p>
                <p className="text-xs text-ink/50">
                  {listing.inStock ? "In stock" : "Out of stock"}
                </p>
                <button
                  onClick={() => setCart(addToCart(cart, listing.id, 1))}
                  className="btn-secondary w-full text-sm"
                >
                  Add to cart
                </button>
              </article>
            ))}
          </div>
        )}

        <section className="card mt-8">
          <h2 className="text-lg font-bold">Cart</h2>
          {totals.lines.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">Your cart is empty.</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {totals.lines.map((line) => (
                  <li key={line.productId} className="flex justify-between text-sm">
                    <span>
                      {line.name} × {line.quantity}
                    </span>
                    <span className="font-semibold">{ugx(line.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink/50">Subtotal {ugx(totals.subtotal)}</p>
            </>
          )}
          <label className="mt-4 block text-sm font-semibold text-ink">
            Delivery area
            <select
              value={band}
              onChange={(event) => setBand(event.target.value)}
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
            >
              {DELIVERY_BANDS.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name} — {ugx(item.fee)}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold text-ink">
            Phone number
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="07xxxxxxxx"
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base"
            />
          </label>
          <button onClick={checkout} className="btn-primary mt-4 w-full">
            Preview checkout · {ugx(totals.total)}
          </button>
          {message ? (
            <p role="status" className="mt-3 rounded-xl bg-kan-soft p-3 text-sm text-kan-dark">
              {message}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
